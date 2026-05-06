import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { Op } from "sequelize";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { connectToDatabase, sequelize } from "./db-mysql.js";
import seedDepartments from "./data/seedDepartments.js";
import seedEmployees from "./data/seedEmployees.js";
import seedAdminProfile from "./data/seedAdminProfile.js";
import Department from "./models-mysql/Department.js";
import Employee from "./models-mysql/Employee.js";
import AdminProfile from "./models-mysql/AdminProfile.js";
import Asset from "./models-mysql/Asset.js";
import Requisition from "./models-mysql/Requisition.js";
import SalaryRecord from "./models-mysql/SalaryRecord.js";
import SalaryIncrement from "./models-mysql/SalaryIncrement.js";
import Leave from "./models-mysql/Leave.js";
import AppSetting from "./models-mysql/AppSetting.js";
import PasswordReset from "./models-mysql/PasswordReset.js";
import { hashPassword, isHashedPassword, verifyPassword } from "./utils/password.js";
import { sendOtpEmail } from "./utils/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");

dotenv.config({ path: envPath, quiet: true });

const app = express();
const port = Number(process.env.PORT || 5000);
const serverStartedAt = new Date().toISOString();
const uploadsRoot = path.join(__dirname, "..", "uploads");
const profileUploadsDir = path.join(uploadsRoot, "profiles");

fs.mkdirSync(profileUploadsDir, { recursive: true });

const profileImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profileUploadsDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const baseName = path
      .basename(file.originalname || "profile-image", extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    cb(null, `${baseName || "profile-image"}-${Date.now()}${extension || ".png"}`);
  },
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image uploads are allowed"));
  },
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(uploadsRoot));

const defaultEmployeePreferences = {
  darkMode: false,
  emailNotifications: true,
  smsAlerts: false,
};

app.get("/api/health", async (_req, res) => {
  return res.json({
    ok: true,
    db: "mysql",
    startedAt: serverStartedAt,
    features: {
      backup: true,
      passwordHashing: true,
    },
  });
});

const defaultLeavePolicy = {
  accrualMethod: "Monthly",
  leaveTypes: {
    annual: {
      daysPerYear: 18,
      carryForwardLimit: 6,
      minNoticeDays: 3,
      maxConsecutiveDays: 10,
      paid: true,
      requiresDocument: false,
      allowHalfDay: true,
    },
    sick: {
      daysPerYear: 12,
      carryForwardLimit: 0,
      minNoticeDays: 0,
      maxConsecutiveDays: 7,
      paid: true,
      requiresDocument: true,
      allowHalfDay: true,
    },
    casual: {
      daysPerYear: 8,
      carryForwardLimit: 0,
      minNoticeDays: 1,
      maxConsecutiveDays: 3,
      paid: true,
      requiresDocument: false,
      allowHalfDay: false,
    },
    maternity: {
      daysPerYear: 90,
      carryForwardLimit: 0,
      minNoticeDays: 30,
      maxConsecutiveDays: 90,
      paid: true,
      requiresDocument: true,
      allowHalfDay: false,
    },
    paternity: {
      daysPerYear: 14,
      carryForwardLimit: 0,
      minNoticeDays: 14,
      maxConsecutiveDays: 14,
      paid: true,
      requiresDocument: true,
      allowHalfDay: false,
    },
    compOff: {
      daysPerYear: 5,
      carryForwardLimit: 2,
      minNoticeDays: 1,
      maxConsecutiveDays: 2,
      paid: true,
      requiresDocument: false,
      allowHalfDay: true,
    },
  },
};

const defaultPayrollConfig = {
  defaultCurrency: "INR",
  payCycle: "Monthly",
  defaultTdsRate: 10,
  overtimeRateMultiplier: 1.5,
  emailPayslip: true,
  autoGeneratePayslips: true,
};

const defaultNotificationSettings = {
  leaveRequestSubmitted: true,
  leaveApproved: true,
  leaveRejected: true,
  payrollProcessed: true,
  newEmployeeOnboarded: false,
  pendingLeaveBadge: true,
  lowLeaveBalance: true,
};

const SETTINGS_KEYS = {
  leavePolicy: "leave-policy",
  payrollConfig: "payroll-config",
  notificationSettings: "notification-settings",
};

const normalizeUsername = (value = "") => String(value).toLowerCase().trim();

const titleCase = (value = "") =>
  String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatIsoDate = (value) => new Date(value).toISOString().slice(0, 10);

const formatLeaveDateRange = (fromDate, toDate) => {
  const format = (value) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  if (!toDate || new Date(fromDate).toDateString() === new Date(toDate).toDateString()) {
    return format(fromDate);
  }

  return `${format(fromDate)} - ${format(toDate)}`;
};

function getPayrollMonthsInRange(periodFrom, periodTo) {
  const from = new Date(periodFrom);
  const to = new Date(periodTo);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return [];
  }

  const normalizedFrom = new Date(Math.min(from.getTime(), to.getTime()));
  const normalizedTo = new Date(Math.max(from.getTime(), to.getTime()));

  const months = [];
  const cursor = new Date(normalizedFrom.getFullYear(), normalizedFrom.getMonth(), 1);
  const endCursor = new Date(normalizedTo.getFullYear(), normalizedTo.getMonth(), 1);

  while (cursor <= endCursor) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const monthStart = new Date(year, cursor.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, cursor.getMonth() + 1, 0, 23, 59, 59, 999);

    const clippedFrom = new Date(Math.max(monthStart.getTime(), normalizedFrom.getTime()));
    const clippedTo = new Date(Math.min(monthEnd.getTime(), normalizedTo.getTime()));

    months.push({
      year,
      month,
      key: `${year}-${String(month).padStart(2, "0")}`,
      periodFrom: clippedFrom,
      periodTo: clippedTo,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

const parseMonthYear = (monthInput) => {
  if (!monthInput) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  if (/^\d{4}-\d{2}$/.test(monthInput)) {
    const [year, month] = monthInput.split("-").map(Number);
    return { month, year };
  }

  const parsed = new Date(monthInput);
  if (!Number.isNaN(parsed.getTime())) {
    return { month: parsed.getMonth() + 1, year: parsed.getFullYear() };
  }

  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const buildPayrollRecordPayload = ({
  employeeRecord,
  month,
  year,
  processedBy,
  processedOn,
  periodFrom = null,
  periodTo = null,
}) => {
  const employee = toPlain(employeeRecord);
  const basic = asNumber(employee.salary);
  const allowance = asNumber(employee.allowance);
  const deduction = Math.round(basic * 0.1);
  const tax = Math.round(basic * 0.05);
  const netSalary = basic + allowance - deduction - tax;

  return {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    department: employee.department,
    month,
    year,
    presentDays: 22,
    absentDays: 0,
    basic,
    allowance,
    deduction,
    tax,
    netSalary,
    status: "Processed",
    processedBy,
    processedOn,
    periodFrom,
    periodTo,
  };
};

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);
const asNumber = (value) => Number(value || 0);
async function syncEmployeeNameReferences(employeeId, nextName, previousName = "") {
  if (!employeeId || !nextName) {
    return;
  }

  const where = {
    [Op.or]: [
      { employeeId },
      ...(previousName
        ? [
            { employeeId: "", employeeName: previousName },
            { employeeId: null, employeeName: previousName },
          ]
        : []),
    ],
  };

  await Promise.all([
    Leave.update({ employeeName: nextName }, { where }),
    Requisition.update({ employeeName: nextName }, { where }),
    Asset.update({ employeeName: nextName }, { where }),
    SalaryRecord.update({ employeeName: nextName }, { where }),
    SalaryIncrement.update({ employeeName: nextName }, { where }),
  ]);
}

const parsePermissionsValue = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return value;
};

async function getAppSettingValue(key, fallbackValue) {
  const record = await AppSetting.findByPk(key);
  if (!record) {
    return fallbackValue;
  }

  const value = record.get("value");
  return value ?? fallbackValue;
}

async function setAppSettingValue(key, value) {
  await AppSetting.upsert({ key, value });
  return value;
}

function serializeDepartment(record) {
  const department = toPlain(record);
  return {
    ...department,
    _id: department._id,
  };
}

async function getDepartmentsLookup() {
  const departments = (await Department.findAll()).map(serializeDepartment);
  const byId = new Map();
  const byName = new Map();

  departments.forEach((department) => {
    byId.set(String(department._id).toLowerCase(), department);
    byName.set(String(department.dep_name).toLowerCase(), department);
  });

  return { byId, byName };
}

async function resolveDepartmentId(rawDepartment) {
  if (!rawDepartment) {
    return "";
  }

  const normalized = String(rawDepartment).trim();
  const { byId, byName } = await getDepartmentsLookup();

  if (byId.has(normalized.toLowerCase())) {
    return byId.get(normalized.toLowerCase())._id;
  }

  if (byName.has(normalized.toLowerCase())) {
    return byName.get(normalized.toLowerCase())._id;
  }

  const createdDepartment = await Department.create({
    _id: normalized.toUpperCase().replace(/\s+/g, "_"),
    dep_name: titleCase(normalized),
    description: `Auto-created from employee department value "${normalized}".`,
  });

  return createdDepartment.get("_id");
}

async function getDepartmentNameById(departmentId) {
  if (!departmentId) {
    return "";
  }

  const department = await Department.findByPk(departmentId);
  return department ? department.get("dep_name") : departmentId;
}

async function serializeEmployee(record) {
  const employee = toPlain(record);
  let departmentId = employee.department || "";

  if (departmentId) {
    departmentId = await resolveDepartmentId(departmentId);
    if (departmentId !== employee.department) {
      await Employee.update({ department: departmentId }, { where: { id: employee.id } });
      employee.department = departmentId;
    }
  }

  const { password: _password, ...safeEmployee } = employee || {};

  return {
    ...safeEmployee,
    _id: String(employee.id),
    salary: asNumber(employee.salary),
    allowance: asNumber(employee.allowance),
    department: departmentId,
    departmentName: await getDepartmentNameById(departmentId),
    preferences: {
      ...defaultEmployeePreferences,
      ...(employee.preferences || {}),
    },
  };
}

async function serializeEmployeeSession(record) {
  const employee = await serializeEmployee(record);
  return {
    _id: employee._id,
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    phone: employee.phone || "",
    address: employee.address || "",
    image: employee.image || "",
    role: employee.role || "Employee",
    designation: employee.designation || "",
    department: employee.department || "",
    departmentName: employee.departmentName || "",
    manager: employee.manager || "",
    preferences: {
      ...defaultEmployeePreferences,
      ...(employee.preferences || {}),
    },
  };
}

function serializeAdminProfile(record) {
  const profile = toPlain(record);
  const { password: _password, ...safeProfile } = profile || {};
  return {
    ...safeProfile,
    _id: String(profile.id),
    image: profile.image || "",
    avatar: profile.image || "",
    permissions: {
      employees: true,
      leaves: true,
      settings: false,
      salary: false,
      ...(profile.permissions || {}),
    },
  };
}

function serializeAsset(record, employeeLookup) {
  const asset = toPlain(record);
  const currentEmployee = getCurrentEmployeeReference(asset, employeeLookup);

  return {
    ...asset,
    _id: String(asset.id),
    employeeId: currentEmployee?.employeeId || asset.employeeId,
    employeeName: currentEmployee?.name || asset.employeeName,
    requisitionId: asset.requisitionId ? String(asset.requisitionId) : "",
    assets: Array.isArray(asset.assets) ? asset.assets : [],
  };
}

function serializeRequisition(record, employeeLookup) {
  const requisition = toPlain(record);
  const currentEmployee = getCurrentEmployeeReference(requisition, employeeLookup);

  return {
    ...requisition,
    _id: String(requisition.id),
    employeeId: currentEmployee?.employeeId || requisition.employeeId,
    employeeName: currentEmployee?.name || requisition.employeeName,
    assets: Array.isArray(requisition.assets) ? requisition.assets : [],
  };
}

function normalizeEmployeeName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getCurrentEmployeeReference(record, employeeLookup) {
  const item = toPlain(record);

  if (!employeeLookup) {
    return null;
  }

  const byId = employeeLookup instanceof Map ? employeeLookup : employeeLookup.byId;
  if (item?.employeeId && byId?.has(String(item.employeeId))) {
    return byId.get(String(item.employeeId));
  }

  const copiedName = normalizeEmployeeName(item?.employeeName || item?.name);
  if (!copiedName || !employeeLookup.activeEmployees) {
    return null;
  }

  const matches = employeeLookup.activeEmployees.filter((employee) => {
    const currentName = normalizeEmployeeName(employee.name);
    return currentName === copiedName || currentName.startsWith(`${copiedName} `);
  });

  return matches.length === 1 ? matches[0] : null;
}

async function getEmployeeLookupByEmployeeId(employeeIds = [], { includeActiveEmployees = false } = {}) {
  const ids = [...new Set(employeeIds.filter(Boolean).map(String))];
  const [employees, activeEmployees] = await Promise.all([
    ids.length > 0
      ? Employee.findAll({ where: { employeeId: { [Op.in]: ids } } })
      : Promise.resolve([]),
    includeActiveEmployees
      ? Employee.findAll({ where: { isActive: true } })
      : Promise.resolve([]),
  ]);

  const byId = new Map(
    employees.map((employee) => [
      String(employee.get("employeeId")),
      toPlain(employee),
    ])
  );

  if (!includeActiveEmployees) {
    return byId;
  }

  activeEmployees.map(toPlain).forEach((employee) => {
    if (employee.employeeId && !byId.has(String(employee.employeeId))) {
      byId.set(String(employee.employeeId), employee);
    }
  });

  return {
    byId,
    activeEmployees: activeEmployees.map(toPlain),
  };
}

async function backfillEmployeeReference(record, serialized) {
  const hasMissingId = !record.get("employeeId") && serialized.employeeId;
  const hasOldName = record.get("employeeName") !== serialized.employeeName;
  const hasOldDepartment =
    serialized.department !== undefined &&
    serialized.department !== record.get("department");

  if (!hasMissingId && !hasOldName && !hasOldDepartment) {
    return;
  }

  const updates = {};
  if (hasMissingId) {
    updates.employeeId = serialized.employeeId;
  }
  if (hasOldName) {
    updates.employeeName = serialized.employeeName;
  }
  if (hasOldDepartment) {
    updates.department = serialized.department;
  }

  await record.update(updates);
}

function serializeLeave(record, employeeLookup) {
  const leave = toPlain(record);
  const currentEmployee = getCurrentEmployeeReference(leave, employeeLookup);
  const employeeName = currentEmployee?.name || leave.employeeName;

  return {
    ...leave,
    _id: String(leave.id),
    id: String(leave.id),
    employeeId: currentEmployee?.employeeId || leave.employeeId,
    employeeName,
    name: employeeName,
    department: currentEmployee?.department || leave.department,
    dates: formatLeaveDateRange(leave.fromDate, leave.toDate),
  };
}

function serializeSalaryRecord(record, employeeLookup) {
  const salaryRecord = toPlain(record);
  const currentEmployee = getCurrentEmployeeReference(salaryRecord, employeeLookup);

  return {
    ...salaryRecord,
    _id: String(salaryRecord.id),
    employeeId: currentEmployee?.employeeId || salaryRecord.employeeId,
    employeeName: currentEmployee?.name || salaryRecord.employeeName,
    department: currentEmployee?.department || salaryRecord.department,
    basic: asNumber(salaryRecord.basic),
    allowance: asNumber(salaryRecord.allowance),
    deduction: asNumber(salaryRecord.deduction),
    tax: asNumber(salaryRecord.tax),
    netSalary: asNumber(salaryRecord.netSalary),
  };
}

function serializeSalaryIncrement(record, employeeLookup) {
  const increment = toPlain(record);
  const currentEmployee = getCurrentEmployeeReference(increment, employeeLookup);

  return {
    ...increment,
    _id: String(increment.id),
    employeeId: currentEmployee?.employeeId || increment.employeeId,
    employeeCode: currentEmployee?.employeeId || increment.employeeCode,
    employeeName: currentEmployee?.name || increment.employeeName,
    department: currentEmployee?.department || increment.department,
    currentSalary: asNumber(increment.currentSalary),
    proposedSalary: asNumber(increment.proposedSalary),
    incrementPercentage: asNumber(increment.incrementPercentage),
  };
}

async function ensureAdminProfileDocument() {
  let profile =
    (await AdminProfile.findOne({ where: { profileId: "admin" } })) ||
    (await AdminProfile.findOne({ where: { username: "admin" } })) ||
    (await AdminProfile.findOne());

  if (!profile) {
    profile = await AdminProfile.create(seedAdminProfile[0]);
    return profile;
  }

  const current = toPlain(profile);
  const seedProfile = seedAdminProfile[0];
  const updates = {};

  if (!current.profileId) updates.profileId = "admin";
  if (!current.name) updates.name = seedProfile.name;
  if (!current.username) updates.username = seedProfile.username;
  if (!current.email) updates.email = seedProfile.email;
  if (!current.phone) updates.phone = seedProfile.phone;
  if (!current.title) updates.title = seedProfile.title;
  if (!current.dept) updates.dept = seedProfile.dept;
  if (!current.location) updates.location = seedProfile.location;
  if (!current.permissions) updates.permissions = seedProfile.permissions;
  if (!current.image) updates.image = seedProfile.image || "";

  if (Object.keys(updates).length > 0) {
    await profile.update(updates);
    await profile.reload();
  }

  return profile;
}

async function requireSalaryPermission(req, res, next) {
  try {
    const profile = await ensureAdminProfileDocument();
    if (profile.get("permissions")?.salary === false) {
      return res.status(403).json({
        error: "You do not have permission to modify salary data. Enable salary permission in Settings > Profile.",
        permissionDenied: true,
      });
    }

    return next();
  } catch (error) {
    console.error("Permission check failed:", error);
    return res.status(500).json({ error: "Permission check failed" });
  }
}

app.get("/api/departments", async (_req, res) => {
  try {
    const departments = await Department.findAll({ order: [["dep_name", "ASC"]] });
    return res.json(departments.map(serializeDepartment));
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return res.status(500).json({ error: "Failed to fetch departments" });
  }
});

app.get("/api/departments/:id", async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    return res.json(serializeDepartment(department));
  } catch (error) {
    console.error("Failed to fetch department:", error);
    return res.status(500).json({ error: "Failed to fetch department" });
  }
});

app.post("/api/departments", async (req, res) => {
  try {
    const { _id, dep_name, description = "" } = req.body;

    if (!_id || !dep_name) {
      return res.status(400).json({ error: "Department ID and department name are required" });
    }

    const existingDepartment = await Department.findByPk(_id);
    if (existingDepartment) {
      return res.status(409).json({ error: "Department ID already exists" });
    }

    const department = await Department.create({ _id, dep_name, description });
    return res.status(201).json(serializeDepartment(department));
  } catch (error) {
    console.error("Failed to create department:", error);
    return res.status(500).json({ error: "Failed to create department" });
  }
});

app.put("/api/departments/:id", async (req, res) => {
  try {
    const { dep_name, description = "" } = req.body;

    if (!dep_name) {
      return res.status(400).json({ error: "Department name is required" });
    }

    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    await department.update({ dep_name, description });
    return res.json(serializeDepartment(department));
  } catch (error) {
    console.error("Failed to update department:", error);
    return res.status(500).json({ error: "Failed to update department" });
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    await department.destroy();
    return res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Failed to delete department:", error);
    return res.status(500).json({ error: "Failed to delete department" });
  }
});

app.get("/api/employees", async (_req, res) => {
  try {
    const includeInactive = String(_req.query?.includeInactive || "").toLowerCase() === "true";
    const where = includeInactive ? {} : { isActive: true };

    const employees = await Employee.findAll({ where, order: [["employeeId", "ASC"]] });
    return res.json(await Promise.all(employees.map(serializeEmployee)));
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json(await serializeEmployee(employee));
  } catch (error) {
    console.error("Failed to fetch employee:", error);
    return res.status(500).json({ error: "Failed to fetch employee" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      dob,
      gender,
      marital,
      designation,
      address,
      manager,
      department,
      salary,
      allowance = 0,
      password,
      role = "Employee",
      image,
      preferences,
    } = req.body;

    if (!employeeId || !name || !email || !department) {
      return res.status(400).json({
        error: "Employee ID, name, email, and department are required",
      });
    }

    const existingEmployee = await Employee.findOne({ where: { employeeId } });
    if (existingEmployee) {
      return res.status(409).json({ error: "Employee ID already exists" });
    }

    const resolvedDepartment = await resolveDepartmentId(department);
    const employee = await Employee.create({
      employeeId,
      name,
      email,
      phone: phone || "",
      dob: dob || null,
      gender: gender || null,
      marital: marital || null,
      designation: designation || "",
      address: address || "",
      manager: manager || "",
      department: resolvedDepartment,
      salary: asNumber(salary),
      allowance: asNumber(allowance),
      password: password || "",
      role: role || "Employee",
      image: image || "",
      preferences: {
        ...defaultEmployeePreferences,
        ...(preferences || {}),
      },
    });

    return res.status(201).json(await serializeEmployee(employee));
  } catch (error) {
    console.error("Failed to create employee:", error);
    return res.status(500).json({ error: "Failed to create employee" });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const {
      name,
      email,
      phone,
      dob,
      gender,
      marital,
      designation,
      address,
      manager,
      department,
      salary,
      allowance = 0,
      password,
      role,
      image,
      preferences,
    } = req.body;

    const resolvedDepartment = await resolveDepartmentId(department);

    const previousName = employee.get("name");

    await employee.update({
      name,
      email,
      phone: phone ?? employee.get("phone") ?? "",
      dob: dob || null,
      gender: gender || null,
      marital: marital || null,
      designation: designation || "",
      address: address ?? employee.get("address") ?? "",
      manager: manager ?? employee.get("manager") ?? "",
      department: resolvedDepartment,
      salary: asNumber(salary),
      allowance: asNumber(allowance),
      password: password || employee.get("password") || "",
      role: role || employee.get("role"),
      image: image ?? employee.get("image") ?? "",
      preferences:
        preferences !== undefined
          ? {
              ...defaultEmployeePreferences,
              ...(employee.get("preferences") || {}),
              ...(preferences || {}),
            }
          : employee.get("preferences") || defaultEmployeePreferences,
    });

    const nextName = employee.get("name");
    if (previousName !== nextName) {
      await syncEmployeeNameReferences(employee.get("employeeId"), nextName, previousName);
    }

    return res.json(await serializeEmployee(employee));
  } catch (error) {
    console.error("Failed to update employee:", error);
    return res.status(500).json({ error: "Failed to update employee" });
  }
});

app.patch("/api/employees/:id/compensation", requireSalaryPermission, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { salary, allowance } = req.body;
    await employee.update({
      salary: salary !== undefined ? asNumber(salary) : employee.get("salary"),
      allowance: allowance !== undefined ? asNumber(allowance) : employee.get("allowance"),
    });

    return res.json(await serializeEmployee(employee));
  } catch (error) {
    console.error("Failed to update employee compensation:", error);
    return res.status(500).json({ error: "Failed to update employee compensation" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await employee.update({ isActive: false, leftAt: new Date() });
    return res.json({ message: "Employee deactivated successfully" });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return res.status(500).json({ error: "Failed to delete employee" });
  }
});

app.post("/api/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const normalizedUsername = normalizeUsername(username);

    const profileRecord = await ensureAdminProfileDocument();
    const recordUsername = normalizeUsername(profileRecord.get("username") || "");
    const recordEmail = normalizeUsername(profileRecord.get("email") || "");

    if (recordUsername !== normalizedUsername && recordEmail !== normalizedUsername) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const verification = await verifyPassword(password, profileRecord.get("password") || "");
    if (!verification.ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (verification.upgradedHash) {
      await profileRecord.update({ password: verification.upgradedHash });
    }

    const profile = serializeAdminProfile(profileRecord);
    return res.json({
      ok: true,
      _id: profile._id,
      username: profile.username,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      avatar: profile.image,
      title: profile.title || "",
      permissions: profile.permissions,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/employee-login", async (req, res) => {
  try {
    const { employeeId, password } = req.body || {};
    const lookupValue = String(employeeId || "").trim();

    if (!lookupValue || !password) {
      return res.status(400).json({ error: "Employee ID and password are required" });
    }

    const employeeRecord = await Employee.findOne({
      where: {
        isActive: true,
        [Op.or]: [{ employeeId: lookupValue }, { email: lookupValue.toLowerCase() }],
      },
    });

    if (!employeeRecord) {
      return res.status(401).json({ error: "Invalid employee credentials" });
    }

    const verification = await verifyPassword(password, employeeRecord.get("password") || "");
    if (!verification.ok) {
      return res.status(401).json({ error: "Invalid employee credentials" });
    }

    if (verification.upgradedHash) {
      await employeeRecord.update({ password: verification.upgradedHash });
    }

    return res.json(await serializeEmployeeSession(employeeRecord));
  } catch (error) {
    console.error("Employee login error:", error);
    return res.status(500).json({ error: "Unable to process employee login" });
  }
});

app.get("/api/employee-profile/:employeeId", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { employeeId: req.params.employeeId, isActive: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json(await serializeEmployee(employee));
  } catch (error) {
    console.error("Failed to fetch employee profile:", error);
    return res.status(500).json({ error: "Failed to fetch employee profile" });
  }
});

app.put("/api/employee-profile/:employeeId", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { employeeId: req.params.employeeId, isActive: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const {
      name,
      email,
      phone,
      address,
      image,
      preferences,
    } = req.body || {};

    const previousName = employee.get("name");

    await employee.update({
      name: name ?? employee.get("name"),
      email: email ?? employee.get("email"),
      phone: phone ?? employee.get("phone") ?? "",
      address: address ?? employee.get("address") ?? "",
      image: image ?? employee.get("image") ?? "",
      preferences:
        preferences !== undefined
          ? {
              ...defaultEmployeePreferences,
              ...(employee.get("preferences") || {}),
              ...(preferences || {}),
            }
          : employee.get("preferences") || defaultEmployeePreferences,
    });

    const nextName = employee.get("name");
    if (previousName !== nextName) {
      await syncEmployeeNameReferences(employee.get("employeeId"), nextName, previousName);
    }

    return res.json(await serializeEmployee(employee));
  } catch (error) {
    console.error("Failed to update employee profile:", error);
    return res.status(500).json({ error: "Failed to update employee profile" });
  }
});

app.patch("/api/employee-profile/:employeeId/password", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { employeeId: req.params.employeeId, isActive: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    const verification = await verifyPassword(String(oldPassword), employee.get("password") || "");
    if (!verification.ok) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    await employee.update({ password: String(newPassword) });
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Failed to update employee password:", error);
    return res.status(500).json({ error: "Failed to update employee password" });
  }
});

app.delete("/api/employee-profile/:employeeId", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { employeeId: req.params.employeeId, isActive: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await employee.update({ isActive: false, leftAt: new Date() });
    return res.json({ message: "Employee account deactivated successfully" });
  } catch (error) {
    console.error("Failed to deactivate employee account:", error);
    return res.status(500).json({ error: "Failed to deactivate employee account" });
  }
});

app.post("/api/admin-password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    const profile = await ensureAdminProfileDocument();
    const verification = await verifyPassword(String(oldPassword), profile.get("password") || "");
    if (!verification.ok) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    await profile.update({ password: String(newPassword) });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to update admin password:", error);
    return res.status(500).json({ error: "Failed to update password" });
  }
});

app.post("/api/admin-password-reset-request", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const profile = await ensureAdminProfileDocument();
    if (normalizeUsername(profile.get("email") || "") !== normalizeUsername(email)) {
      return res.status(404).json({ error: "No admin account found with that email" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.create({ email, otp, expiresAt });
    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.json({ ok: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Failed to send reset OTP:", error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/admin-password-reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const resetRecord = await PasswordReset.findOne({
      where: { email, otp, used: false },
      order: [["createdAt", "DESC"]],
    });

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (new Date() > resetRecord.get("expiresAt")) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const profile = await ensureAdminProfileDocument();
    if (normalizeUsername(profile.get("email") || "") !== normalizeUsername(email)) {
      return res.status(404).json({ error: "No admin account found with that email" });
    }

    await profile.update({ password: String(newPassword) });
    await resetRecord.update({ used: true });

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Failed to reset admin password:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

app.post("/api/employee-password-reset-verify", async (req, res) => {
  try {
    const { identifier } = req.body || {};
    const lookupValue = String(identifier || "").trim();

    if (!lookupValue) {
      return res.status(400).json({ error: "Employee ID or email is required" });
    }

    const employee = await Employee.findOne({
      where: {
        isActive: true,
        [Op.or]: [{ employeeId: lookupValue }, { email: normalizeUsername(lookupValue) }],
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "No active employee found with that ID or email" });
    }

    return res.json({
      ok: true,
      employeeId: employee.get("employeeId"),
      email: employee.get("email"),
      name: employee.get("name"),
    });
  } catch (error) {
    console.error("Failed to verify employee password reset:", error);
    return res.status(500).json({ error: "Failed to verify employee account" });
  }
});

app.post("/api/employee-password-reset", async (req, res) => {
  try {
    const { identifier, newPassword } = req.body || {};
    const lookupValue = String(identifier || "").trim();

    if (!lookupValue || !newPassword) {
      return res.status(400).json({ error: "Employee ID or email and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const employee = await Employee.findOne({
      where: {
        isActive: true,
        [Op.or]: [{ employeeId: lookupValue }, { email: normalizeUsername(lookupValue) }],
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "No active employee found with that ID or email" });
    }

    await employee.update({ password: String(newPassword) });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to reset employee password:", error);
    return res.status(500).json({ error: "Failed to reset employee password" });
  }
});

app.get("/api/backup", async (_req, res) => {
  try {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);

    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST || "localhost";

    const backupFile = path.join(
      __dirname,
      `hrms-backup-${dateStamp}.sql`
    );

    const command =
      `mysqldump -h ${dbHost} -u ${dbUser} -p${dbPass} ${dbName} > "${backupFile}"`;

    exec(command, (error) => {
      if (error) {
        console.error("Backup failed:", error);
        return res.status(500).json({
          error: "Failed to generate backup",
        });
      }

      return res.download(backupFile, () => {
        try {
          fs.unlinkSync(backupFile);
        } catch (err) {
          console.error("Failed to delete temp backup file:", err);
        }
      });
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return res.status(500).json({
      error: "Failed to generate backup",
    });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.query.employeeId) {
      where.employeeId = String(req.query.employeeId);
    }

    const employees = (await Employee.findAll({ where, order: [["employeeId", "ASC"]] })).map(toPlain);
    const leaves = (await Leave.findAll()).map(toPlain);
    const today = new Date();
    const todayIso = formatIsoDate(today);

    const attendance = employees.map((employee, index) => {
      const activeLeave = leaves.find((leave) => {
        const from = formatIsoDate(leave.fromDate);
        const to = formatIsoDate(leave.toDate || leave.fromDate);
        return leave.employeeId === employee.employeeId && todayIso >= from && todayIso <= to;
      });

      if (activeLeave) {
        return {
          employeeId: employee.employeeId,
          name: employee.name,
          date: todayIso,
          inTime: "-",
          outTime: "-",
          department: employee.department,
          overtime: "0h",
          status: "On Leave",
        };
      }

      const isLateArrival = index % 3 === 2;
      const isAbsent = index % 5 === 4;

      return {
        employeeId: employee.employeeId,
        name: employee.name,
        date: todayIso,
        inTime: isAbsent ? "-" : isLateArrival ? "09:30 AM" : "09:00 AM",
        outTime: isAbsent ? "-" : "06:00 PM",
        department: employee.department,
        overtime: isAbsent ? "0h" : isLateArrival ? "0.5h" : "0h",
        status: isAbsent ? "Absent" : isLateArrival ? "Late" : "Present",
      };
    });

    return res.json(attendance);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

app.get("/api/leave-policy", (_req, res) => {
  (async () => {
    const policy = await getAppSettingValue(SETTINGS_KEYS.leavePolicy, defaultLeavePolicy);
    return res.json({ success: true, policy });
  })().catch((error) => {
    console.error("Failed to fetch leave policy:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch leave policy" });
  });
});

app.post("/api/leave-policy", (req, res) => {
  const nextPolicy = {
    ...defaultLeavePolicy,
    ...req.body,
    leaveTypes: {
      ...defaultLeavePolicy.leaveTypes,
      ...(req.body?.leaveTypes || {}),
    },
  };

  (async () => {
    await setAppSettingValue(SETTINGS_KEYS.leavePolicy, nextPolicy);
    return res.json({ success: true, policy: nextPolicy });
  })().catch((error) => {
    console.error("Failed to update leave policy:", error);
    return res.status(500).json({ success: false, error: "Failed to update leave policy" });
  });
});

app.get("/api/payroll-config", (_req, res) => {
  (async () => {
    const config = await getAppSettingValue(SETTINGS_KEYS.payrollConfig, defaultPayrollConfig);
    return res.json({ success: true, config: { ...defaultPayrollConfig, ...(config || {}) } });
  })().catch((error) => {
    console.error("Failed to fetch payroll config:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch payroll config" });
  });
});

app.put("/api/payroll-config", (req, res) => {
  (async () => {
    const config = { ...defaultPayrollConfig, ...(req.body || {}) };
    await setAppSettingValue(SETTINGS_KEYS.payrollConfig, config);
    return res.json({ success: true, config });
  })().catch((error) => {
    console.error("Failed to update payroll config:", error);
    return res.status(500).json({ success: false, error: "Failed to update payroll config" });
  });
});

app.get("/api/notification-settings", (_req, res) => {
  (async () => {
    const settings = await getAppSettingValue(
      SETTINGS_KEYS.notificationSettings,
      defaultNotificationSettings
    );
    return res.json({
      success: true,
      settings: { ...defaultNotificationSettings, ...(settings || {}) },
    });
  })().catch((error) => {
    console.error("Failed to fetch notification settings:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch notification settings" });
  });
});

app.put("/api/notification-settings", (req, res) => {
  (async () => {
    const settings = { ...defaultNotificationSettings, ...(req.body || {}) };
    await setAppSettingValue(SETTINGS_KEYS.notificationSettings, settings);
    return res.json({ success: true, settings });
  })().catch((error) => {
    console.error("Failed to update notification settings:", error);
    return res.status(500).json({ success: false, error: "Failed to update notification settings" });
  });
});

app.get("/api/admin-profile", async (_req, res) => {
  try {
    return res.json(serializeAdminProfile(await ensureAdminProfileDocument()));
  } catch (error) {
    console.error("Failed to fetch admin profile:", error);
    return res.status(500).json({ error: "Failed to fetch admin profile" });
  }
});

app.put("/api/admin-profile", uploadProfileImage.single("imageFile"), async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      title,
      dept,
      location,
      image,
      avatar,
      password,
      permissions = {},
    } = req.body;

    if (!name || !email || !username) {
      return res.status(400).json({ error: "Name, username and email are required" });
    }

    const [profile] = await AdminProfile.findOrCreate({
      where: { profileId: "admin" },
      defaults: seedAdminProfile[0],
    });

    const profileImagePath = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : image ?? avatar ?? profile.get("image") ?? "";

    await profile.update({
      profileId: "admin",
      name,
      username: normalizeUsername(username),
      email: normalizeUsername(email),
      phone: phone || "",
      title: title || "",
      dept: dept || "",
      location: location || "",
      image: profileImagePath,
      password: password || profile.get("password") || seedAdminProfile[0].password,
      permissions: parsePermissionsValue(permissions),
    });

    return res.json(serializeAdminProfile(profile));
  } catch (error) {
    console.error("Failed to update admin profile:", error);
    return res.status(500).json({ error: "Failed to update admin profile" });
  }
});

app.get("/api/assets", async (req, res) => {
  try {
    const where = {};
    if (req.query.employeeId) {
      where.employeeId = String(req.query.employeeId);
    }

    const assets = await Asset.findAll({
      where,
      order: [["assignedDate", "DESC"], ["createdAt", "DESC"]],
    });
    const employeeLookup = await getEmployeeLookupByEmployeeId(
      assets.map((asset) => asset.get("employeeId")),
      { includeActiveEmployees: true }
    );
    const serializedAssets = assets.map((asset) => serializeAsset(asset, employeeLookup));
    await Promise.all(
      assets.map((asset, index) => backfillEmployeeReference(asset, serializedAssets[index]))
    );

    return res.json(serializedAssets);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return res.status(500).json({ error: "Failed to fetch assets" });
  }
});

app.get("/api/assets/:id", async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset record not found" });
    }

    const employeeLookup = await getEmployeeLookupByEmployeeId([asset.get("employeeId")], {
      includeActiveEmployees: true,
    });
    const serializedAsset = serializeAsset(asset, employeeLookup);
    await backfillEmployeeReference(asset, serializedAsset);

    return res.json(serializedAsset);
  } catch (error) {
    console.error("Failed to fetch asset record:", error);
    return res.status(500).json({ error: "Failed to fetch asset record" });
  }
});

app.post("/api/assets/assign", async (req, res) => {
  try {
    const { employeeId, requisitionId, assets = [] } = req.body;

    if (!employeeId || assets.length === 0) {
      return res.status(400).json({ error: "Employee and asset details are required" });
    }

    const employee = await Employee.findOne({ where: { employeeId } });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found for asset assignment" });
    }

    const assetRecord = await Asset.create({
      employeeId,
      employeeName: employee.get("name"),
      requisitionId: requisitionId ? String(requisitionId) : null,
      assets: assets.map((asset) => ({
        name: asset.name,
        serialNumber: asset.serialNumber || "",
        liabilityAmount: asNumber(asset.liabilityAmount),
        status: asset.status || "Assigned",
      })),
      assignedDate: new Date(),
    });

    if (requisitionId) {
      await Requisition.update({ status: "Fulfilled" }, { where: { id: req.body.requisitionId } });
    }

    const employeeLookup = await getEmployeeLookupByEmployeeId([assetRecord.get("employeeId")]);
    return res.status(201).json(serializeAsset(assetRecord, employeeLookup));
  } catch (error) {
    console.error("Failed to assign assets:", error);
    return res.status(500).json({ error: "Failed to assign assets" });
  }
});

app.put("/api/assets/:id", async (req, res) => {
  try {
    const assetRecord = await Asset.findByPk(req.params.id);
    if (!assetRecord) {
      return res.status(404).json({ error: "Asset record not found" });
    }

    const { assignedDate, assets = [] } = req.body;
    const employee = await Employee.findOne({
      where: { employeeId: assetRecord.get("employeeId") },
    });

    await assetRecord.update({
      employeeName: employee?.get("name") || assetRecord.get("employeeName"),
      assignedDate: assignedDate || assetRecord.get("assignedDate"),
      assets: assets.map((asset) => ({
        name: asset.name,
        serialNumber: asset.serialNumber || "",
        liabilityAmount: asNumber(asset.liabilityAmount),
        status: asset.status || "Assigned",
      })),
    });

    const employeeLookup = await getEmployeeLookupByEmployeeId([assetRecord.get("employeeId")], {
      includeActiveEmployees: true,
    });
    const serializedAsset = serializeAsset(assetRecord, employeeLookup);
    await backfillEmployeeReference(assetRecord, serializedAsset);

    return res.json(serializedAsset);
  } catch (error) {
    console.error("Failed to update asset record:", error);
    return res.status(500).json({ error: "Failed to update asset record" });
  }
});

app.delete("/api/assets/:id", async (req, res) => {
  try {
    const assetRecord = await Asset.findByPk(req.params.id);
    if (!assetRecord) {
      return res.status(404).json({ error: "Asset record not found" });
    }

    await assetRecord.destroy();
    return res.json({ message: "Asset record deleted successfully" });
  } catch (error) {
    console.error("Failed to delete asset record:", error);
    return res.status(500).json({ error: "Failed to delete asset record" });
  }
});

app.get("/api/requisitions", async (req, res) => {
  try {
    const where = {};
    if (req.query.employeeId) {
      where.employeeId = String(req.query.employeeId);
    }

    const requisitions = await Requisition.findAll({
      where,
      order: [["requestDate", "DESC"], ["createdAt", "DESC"]],
    });
    const employeeLookup = await getEmployeeLookupByEmployeeId(
      requisitions.map((requisition) => requisition.get("employeeId")),
      { includeActiveEmployees: true }
    );
    const serializedRequisitions = requisitions.map((requisition) =>
      serializeRequisition(requisition, employeeLookup)
    );
    await Promise.all(
      requisitions.map((requisition, index) =>
        backfillEmployeeReference(requisition, serializedRequisitions[index])
      )
    );

    return res.json(serializedRequisitions);
  } catch (error) {
    console.error("Failed to fetch requisitions:", error);
    return res.status(500).json({ error: "Failed to fetch requisitions" });
  }
});

app.post("/api/requisitions", async (req, res) => {
  try {
    const { employeeId, assets = [] } = req.body;

    if (!employeeId || assets.length === 0) {
      return res.status(400).json({ error: "Employee and requested assets are required" });
    }

    const employee = await Employee.findOne({ where: { employeeId, isActive: true } });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found for requisition" });
    }

    const requisition = await Requisition.create({
      employeeId,
      employeeName: employee.get("name"),
      assets: assets.map((asset) => ({
        name: asset.name,
        status: asset.status || "Pending",
        liabilityAmount: asNumber(asset.liabilityAmount),
      })),
    });

    const employeeLookup = await getEmployeeLookupByEmployeeId([requisition.get("employeeId")]);
    return res.status(201).json(serializeRequisition(requisition, employeeLookup));
  } catch (error) {
    console.error("Failed to create requisition:", error);
    return res.status(500).json({ error: "Failed to create requisition" });
  }
});

app.put("/api/requisitions/:id", async (req, res) => {
  try {
    const requisition = await Requisition.findByPk(req.params.id);
    if (!requisition) {
      return res.status(404).json({ error: "Requisition not found" });
    }

    const { assets = [], status } = req.body;
    await requisition.update({ assets, status });
    const employeeLookup = await getEmployeeLookupByEmployeeId([requisition.get("employeeId")], {
      includeActiveEmployees: true,
    });
    const serializedRequisition = serializeRequisition(requisition, employeeLookup);
    await backfillEmployeeReference(requisition, serializedRequisition);

    return res.json(serializedRequisition);
  } catch (error) {
    console.error("Failed to update requisition:", error);
    return res.status(500).json({ error: "Failed to update requisition" });
  }
});

app.get("/api/leaves", async (req, res) => {
  try {
    const where = {};
    if (req.query.employeeId) {
      where.employeeId = String(req.query.employeeId);
    }

    const leaves = await Leave.findAll({ where, order: [["createdAt", "DESC"]] });
    const employeeLookup = await getEmployeeLookupByEmployeeId(
      leaves.map((leave) => leave.get("employeeId")),
      { includeActiveEmployees: true }
    );

    const serializedLeaves = leaves.map((leave) => serializeLeave(leave, employeeLookup));
    await Promise.all(
      leaves.map((leave, index) => {
        const serialized = serializedLeaves[index];
        const hasMissingId = !leave.get("employeeId");
        const hasOldName = leave.get("employeeName") !== serialized.employeeName;

        if (!hasMissingId && !hasOldName) {
          return Promise.resolve();
        }

        return leave.update({
          employeeId: serialized.employeeId || leave.get("employeeId"),
          employeeName: serialized.employeeName,
          department: serialized.department || leave.get("department"),
        });
      })
    );

    return res.json(serializedLeaves);
  } catch (error) {
    console.error("Failed to fetch leaves:", error);
    return res.status(500).json({ error: "Failed to fetch leaves" });
  }
});

app.post("/api/leaves", async (req, res) => {
  try {
    const { employee, type, from, to, reason = "", attachmentName = "" } = req.body;

    if (!employee || !type || !from) {
      return res.status(400).json({ error: "Employee, leave type and from date are required" });
    }

    const employeeRecord = await Employee.findOne({
      where: {
        [Op.or]: [{ employeeId: employee }, { name: employee }],
      },
    });

    const fromDate = new Date(from);
    const toDate = new Date(to || from);
    const dayDiff =
      Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const leave = await Leave.create({
      employeeId: employeeRecord?.get("employeeId") || "",
      employeeName: employeeRecord?.get("name") || employee,
      department: employeeRecord?.get("department") || "",
      type,
      fromDate,
      toDate,
      days: dayDiff,
      status: "Pending",
      reason,
      attachmentName,
    });

    const employeeLookup = await getEmployeeLookupByEmployeeId([leave.get("employeeId")]);
    return res.status(201).json(serializeLeave(leave, employeeLookup));
  } catch (error) {
    console.error("Failed to create leave:", error);
    return res.status(500).json({ error: "Failed to create leave" });
  }
});

app.patch("/api/leaves/:id/status", async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    await leave.update({ status: req.body.status });
    const employeeLookup = await getEmployeeLookupByEmployeeId([leave.get("employeeId")]);
    return res.json(serializeLeave(leave, employeeLookup));
  } catch (error) {
    console.error("Failed to update leave status:", error);
    return res.status(500).json({ error: "Failed to update leave status" });
  }
});

app.get("/api/salaries", async (req, res) => {
  try {
    const where = {};
    if (req.query.employeeId) {
      where.employeeId = String(req.query.employeeId);
    }

    const records = await SalaryRecord.findAll({
      where,
      order: [["year", "DESC"], ["month", "DESC"], ["employeeId", "ASC"]],
    });
    const employeeLookup = await getEmployeeLookupByEmployeeId(
      records.map((record) => record.get("employeeId"))
    );

    return res.json(records.map((record) => serializeSalaryRecord(record, employeeLookup)));
  } catch (error) {
    console.error("Failed to fetch salary records:", error);
    return res.status(500).json({ error: "Failed to fetch salary records" });
  }
});

app.post("/api/salaries/generate", requireSalaryPermission, async (req, res) => {
  try {
    const {
      month: monthInput,
      department = "All Departments",
      employeeIds = [],
      processedBy = "Admin",
      processedOn,
      periodFrom,
      periodTo,
    } = req.body;

    const processedOnDate = processedOn ? new Date(processedOn) : new Date();
    const processedOnValue = Number.isNaN(processedOnDate.getTime()) ? new Date() : processedOnDate;

    const periodFromDate = periodFrom ? new Date(periodFrom) : null;
    const periodToDate = periodTo ? new Date(periodTo) : null;
    const hasRange =
      periodFromDate &&
      periodToDate &&
      !Number.isNaN(periodFromDate.getTime()) &&
      !Number.isNaN(periodToDate.getTime());

    const monthsInRange = hasRange ? getPayrollMonthsInRange(periodFromDate, periodToDate) : null;
    const singleMonth = parseMonthYear(monthInput);
    const { month, year } = singleMonth;

    const where = { isActive: true };
    if (department && department !== "All Departments") {
      where.department = department;
    }
    if (employeeIds.length > 0) {
      where.employeeId = { [Op.in]: employeeIds };
    }

    const employees = await Employee.findAll({
      where,
      order: [["employeeId", "ASC"]],
    });

    if (employees.length === 0) {
      return res.status(400).json({ error: "No active employees found for payroll generation" });
    }

    const employeeIdList = employees.map((employee) => employee.get("employeeId"));

    const targetMonths =
      monthsInRange && monthsInRange.length > 0
        ? monthsInRange
        : [
            {
              month,
              year,
              key: `${year}-${String(month).padStart(2, "0")}`,
              periodFrom: null,
              periodTo: null,
            },
          ];

    await SalaryRecord.destroy({
      where: {
        employeeId: { [Op.in]: employeeIdList },
        [Op.or]: targetMonths.map((entry) => ({
          month: entry.month,
          year: entry.year,
        })),
      },
    });

    const recordsPayload = targetMonths.flatMap((entry) =>
      employees.map((employeeRecord) =>
        buildPayrollRecordPayload({
          employeeRecord,
          month: entry.month,
          year: entry.year,
          processedBy,
          processedOn: processedOnValue,
          periodFrom: entry.periodFrom,
          periodTo: entry.periodTo,
        })
      )
    );

    await SalaryRecord.bulkCreate(recordsPayload);

    const monthKeys = targetMonths.map((entry) => entry.key);

    const recordsWhere = {
      employeeId: { [Op.in]: employeeIdList },
      [Op.or]: monthKeys.map((key) => {
        const [y, m] = key.split("-").map(Number);
        return { year: y, month: m };
      }),
    };

    const createdRecords = await SalaryRecord.findAll({
      where: recordsWhere,
      order: [["year", "ASC"], ["month", "ASC"], ["employeeId", "ASC"]],
    });
    const employeeLookup = await getEmployeeLookupByEmployeeId(
      createdRecords.map((record) => record.get("employeeId"))
    );
    const serializedRecords = createdRecords.map((record) =>
      serializeSalaryRecord(record, employeeLookup)
    );

    const rangeFromIso = hasRange ? new Date(Math.min(periodFromDate.getTime(), periodToDate.getTime())).toISOString().slice(0, 10) : null;
    const rangeToIso = hasRange ? new Date(Math.max(periodFromDate.getTime(), periodToDate.getTime())).toISOString().slice(0, 10) : null;

    return res.status(201).json({
      periodFrom: rangeFromIso,
      periodTo: rangeToIso,
      months: monthKeys,
      month: monthKeys.length === 1 ? monthKeys[0] : `${monthKeys[0]} to ${monthKeys[monthKeys.length - 1]}`,
      totalEmployees: employees.length,
      totalRecords: serializedRecords.length,
      totalBasic: serializedRecords.reduce((sum, record) => sum + record.basic, 0),
      totalAllowance: serializedRecords.reduce((sum, record) => sum + record.allowance, 0),
      totalDeduction: serializedRecords.reduce((sum, record) => sum + record.deduction, 0),
      totalNetSalary: serializedRecords.reduce((sum, record) => sum + record.netSalary, 0),
      records: serializedRecords,
    });
  } catch (error) {
    console.error("Failed to generate payroll:", error);
    return res.status(500).json({ error: "Failed to generate payroll" });
  }
});

app.get("/api/salary-increments", async (_req, res) => {
  try {
    const increments = await SalaryIncrement.findAll({ order: [["createdAt", "DESC"]] });
    const employeeLookup = await getEmployeeLookupByEmployeeId(
      increments.map((increment) => increment.get("employeeId"))
    );

    return res.json(increments.map((increment) => serializeSalaryIncrement(increment, employeeLookup)));
  } catch (error) {
    console.error("Failed to fetch salary increments:", error);
    return res.status(500).json({ error: "Failed to fetch salary increments" });
  }
});

app.post("/api/salary-increments", requireSalaryPermission, async (req, res) => {
  try {
    const { employeeId, proposedSalary, incrementDate } = req.body;

    if (!employeeId || !proposedSalary || !incrementDate) {
      return res.status(400).json({ error: "Employee ID, proposed salary and date are required" });
    }

    const employee = await Employee.findOne({ where: { employeeId } });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (employee.get("isActive") === false) {
      return res.status(400).json({ error: "Cannot create increment for an inactive employee" });
    }

    const currentSalary = asNumber(employee.get("salary"));
    const nextSalary = asNumber(proposedSalary);
    const incrementPercentage =
      currentSalary === 0 ? 100 : Number((((nextSalary - currentSalary) / currentSalary) * 100).toFixed(2));

    const increment = await SalaryIncrement.create({
      employeeId: employee.get("employeeId"),
      employeeCode: employee.get("employeeId"),
      employeeName: employee.get("name"),
      department: employee.get("department"),
      currentSalary,
      proposedSalary: nextSalary,
      incrementPercentage,
      incrementDate,
      status: "Pending Approval",
    });

    const employeeLookup = await getEmployeeLookupByEmployeeId([increment.get("employeeId")]);
    return res.status(201).json(serializeSalaryIncrement(increment, employeeLookup));
  } catch (error) {
    console.error("Failed to create salary increment:", error);
    return res.status(500).json({ error: "Failed to create salary increment" });
  }
});

app.patch("/api/salary-increments/:id/status", requireSalaryPermission, async (req, res) => {
  try {
    const increment = await SalaryIncrement.findByPk(req.params.id);
    if (!increment) {
      return res.status(404).json({ error: "Salary increment not found" });
    }

    const { status, reviewedBy = "Admin", note = "" } = req.body;
    await increment.update({ status, reviewedBy, note });

    if (status === "Approved") {
      await Employee.update(
        { salary: increment.get("proposedSalary") },
        { where: { employeeId: increment.get("employeeId") } }
      );
    }

    const employeeLookup = await getEmployeeLookupByEmployeeId([increment.get("employeeId")]);
    return res.json(serializeSalaryIncrement(increment, employeeLookup));
  } catch (error) {
    console.error("Failed to update salary increment status:", error);
    return res.status(500).json({ error: "Failed to update salary increment status" });
  }
});

async function ensureSeedDepartments() {
  if ((await Department.count()) > 0) {
    return;
  }

  await Department.bulkCreate(seedDepartments);
  console.log(`Inserted ${seedDepartments.length} starter departments`);
}

async function ensureSeedEmployees() {
  if ((await Employee.count()) > 0) {
    return;
  }

  const employees = [];
  for (const employee of seedEmployees) {
    employees.push({
      ...employee,
      department: await resolveDepartmentId(employee.department),
      salary: asNumber(employee.salary),
      allowance: asNumber(employee.allowance),
    });
  }

  await Employee.bulkCreate(employees, { individualHooks: true });
  console.log(`Inserted ${seedEmployees.length} starter employees`);
}

async function ensureSeedAdminProfile() {
  if ((await AdminProfile.count()) === 0) {
    await AdminProfile.bulkCreate(seedAdminProfile, { individualHooks: true });
    console.log(`Inserted ${seedAdminProfile.length} starter admin profiles`);
  }

  await ensureAdminProfileDocument();
}

async function ensureEmployeeDepartmentsExist() {
  const employees = await Employee.findAll();
  for (const employee of employees) {
    await serializeEmployee(employee);
  }
}

async function ensureSeedLeaves() {
  if ((await Leave.count()) > 0) {
    return;
  }

  const seededLeaves = [
    {
      employeeId: "EMP001",
      employeeName: "Amir Khan",
      department: await resolveDepartmentId("HR"),
      type: "Annual",
      fromDate: new Date("2026-04-08"),
      toDate: new Date("2026-04-10"),
      days: 3,
      status: "Pending",
      reason: "Family commitment",
    },
    {
      employeeId: "EMP002",
      employeeName: "Sara Ali",
      department: await resolveDepartmentId("IT"),
      type: "Sick",
      fromDate: new Date("2026-04-09"),
      toDate: new Date("2026-04-11"),
      days: 3,
      status: "Pending",
      reason: "Medical rest",
    },
    {
      employeeId: "EMP003",
      employeeName: "Bilal Khan",
      department: await resolveDepartmentId("Database"),
      type: "Casual",
      fromDate: new Date("2026-04-12"),
      toDate: new Date("2026-04-12"),
      days: 1,
      status: "Approved",
      reason: "Personal errand",
    },
  ];

  await Leave.bulkCreate(seededLeaves);
}

async function ensureAppSettingsDefaults() {
  const existing = await AppSetting.findAll({ attributes: ["key"] });
  const keys = new Set(existing.map((record) => record.get("key")));

  const inserts = [];
  if (!keys.has(SETTINGS_KEYS.leavePolicy)) {
    inserts.push({ key: SETTINGS_KEYS.leavePolicy, value: defaultLeavePolicy });
  }
  if (!keys.has(SETTINGS_KEYS.payrollConfig)) {
    inserts.push({ key: SETTINGS_KEYS.payrollConfig, value: defaultPayrollConfig });
  }
  if (!keys.has(SETTINGS_KEYS.notificationSettings)) {
    inserts.push({ key: SETTINGS_KEYS.notificationSettings, value: defaultNotificationSettings });
  }

  if (inserts.length > 0) {
    await AppSetting.bulkCreate(inserts);
  }
}

async function upgradePlaintextPasswords() {
  const employees = await Employee.findAll({ attributes: ["id", "password"] });
  for (const employee of employees) {
    const stored = employee.get("password");
    if (typeof stored !== "string" || stored.length === 0) {
      continue;
    }
    if (isHashedPassword(stored)) {
      continue;
    }

    await Employee.update({ password: await hashPassword(stored) }, { where: { id: employee.get("id") } });
  }

  const profiles = await AdminProfile.findAll({ attributes: ["id", "password"] });
  for (const profile of profiles) {
    const stored = profile.get("password");
    if (typeof stored !== "string" || stored.length === 0) {
      continue;
    }
    if (isHashedPassword(stored)) {
      continue;
    }

    await AdminProfile.update({ password: await hashPassword(stored) }, { where: { id: profile.get("id") } });
  }
}

async function startServer() {
  try {
    await connectToDatabase();
    await sequelize.sync({ alter: true });
    await ensureAppSettingsDefaults();
    await ensureSeedDepartments();
    await ensureSeedEmployees();
    await ensureSeedAdminProfile();
    await ensureEmployeeDepartmentsExist();
    await ensureSeedLeaves();
    await upgradePlaintextPasswords();

    app.listen(port, () => {
      console.log("Connected to MySQL database");
      console.log(`HRMS API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
