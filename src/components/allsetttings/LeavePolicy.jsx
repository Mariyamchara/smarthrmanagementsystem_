import React, { useEffect, useState } from "react";

/* =========================
   Toggle
========================= */
const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <input
      type="checkbox"
      checked={checked || false}
      onChange={onChange}
      className="w-5 h-5 accent-[#3f3d9c]"
    />
  </div>
);

/* =========================
   Input
========================= */
const Input = ({ label, value, onChange, type = "number" }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-500">{label}</label>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f3d9c]"
    />
  </div>
);

/* =========================
   Leave Type Card
========================= */
const LeaveTypeCard = ({ title, data = {}, onChange }) => {
  const [open, setOpen] = useState(false);

  const update = (key, value) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center p-4 cursor-pointer"
      >
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="p-4 border-t space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Days / Year"
              value={data.daysPerYear}
              onChange={(e) => update("daysPerYear", e.target.value)}
            />

            <Input
              label="Carry Forward Limit"
              value={data.carryForwardLimit}
              onChange={(e) => update("carryForwardLimit", e.target.value)}
            />

            <Input
              label="Min Notice Period"
              value={data.minNoticeDays}
              onChange={(e) => update("minNoticeDays", e.target.value)}
            />

            <Input
              label="Max Consecutive Days"
              value={data.maxConsecutiveDays}
              onChange={(e) => update("maxConsecutiveDays", e.target.value)}
            />
          </div>

          <div className="border-t pt-3 space-y-1">
            <Toggle
              label="Paid Leave"
              checked={data.paid}
              onChange={() => update("paid", !data.paid)}
            />
            <Toggle
              label="Requires Document"
              checked={data.requiresDocument}
              onChange={() =>
                update("requiresDocument", !data.requiresDocument)
              }
            />
            <Toggle
              label="Allow Half Day"
              checked={data.allowHalfDay}
              onChange={() => update("allowHalfDay", !data.allowHalfDay)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================
   DEFAULT POLICY (CRITICAL)
========================= */
const defaultPolicy = {
  accrualMethod: "Monthly",
  leaveTypes: {
    annual: {},
    sick: {},
    casual: {},
    maternity: {},
    paternity: {},
    compOff: {},
  },
};

/* =========================
   MAIN
========================= */
const LeavePolicy = () => {
  const [policy, setPolicy] = useState(defaultPolicy);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ========= FETCH ========= */
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await fetch(`/api/leave-policy`);
        const data = await res.json();

        if (data.success) {
          setPolicy({
            ...defaultPolicy,
            ...data.policy,
            leaveTypes: {
              ...defaultPolicy.leaveTypes,
              ...(data.policy?.leaveTypes || {}),
            },
          });
        }
      } catch (error) {
        console.error("Failed to load policy", error);
      }
    };

    fetchPolicy();
  }, []);

  /* ========= UPDATE ========= */
  const updateLeaveType = (key, newData) => {
    setPolicy((prev) => ({
      ...prev,
      leaveTypes: {
        ...prev.leaveTypes,
        [key]: newData,
      },
    }));
  };

  /* ========= SAVE ========= */
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/leave-policy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policy),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Policy saved successfully!");
      } else {
        setMessage("Save failed");
      }
    } catch (error) {
      console.error("Error saving policy", error);
      setMessage("Error saving policy");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  /* ========= SUMMARY ========= */
  const totalLeaveTypes = Object.keys(policy.leaveTypes || {}).length;

  const totalPaidDays = Object.values(policy.leaveTypes || {}).reduce(
    (sum, item) => sum + Number(item?.daysPerYear || 0),
    0,
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* TOP */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Total Leave Types</p>
          <p className="text-xl font-bold">{totalLeaveTypes}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Total Paid Days</p>
          <p className="text-xl font-bold">{totalPaidDays}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Accrual</p>
          <select
            value={policy.accrualMethod}
            onChange={(e) =>
              setPolicy({ ...policy, accrualMethod: e.target.value })
            }
            className="mt-2 border px-2 py-1"
          >
            <option>Monthly</option>
            <option>Yearly</option>
            <option>Daily</option>
          </select>
        </div>
      </div>

      {/* LEAVE TYPES */}
      <div
        className="grid grid-cols-2 gap-4"
        style={{ alignItems: "start", marginTop: "16px" }}
      >
        {Object.entries(policy.leaveTypes || {}).map(([key, value]) => (
          <LeaveTypeCard
            key={key}
            title={key.toUpperCase()}
            data={value || {}}
            onChange={(data) => updateLeaveType(key, data)}
          />
        ))}
      </div>

      {/* SAVE */}
      <div className="text-right" style={{ marginTop: "16px" }}>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#3f3d9c] text-white px-6 py-2 rounded-lg"
        >
          {loading ? "Saving..." : "Save Policy"}
        </button>
      </div>

      {message && <p className="text-center text-green-600">{message}</p>}
    </div>
  );
};

export default LeavePolicy;
