import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createDepartment, getDepartments } from "../../lib/departmentsApi";

const emptyDepartment = {
  _id: "",
  dep_name: "",
  description: "",
};

const generateDepartmentId = (departments = []) => {
  const nextNumber =
    departments
      .map((department) => {
        const match = String(department._id || "").match(/(\d+)$/);
        return match ? Number(match[1]) : 0;
      })
      .reduce((max, current) => Math.max(max, current), 0) + 1;

  return `DEP${String(nextNumber).padStart(3, "0")}`;
};

const AddDepartment = () => {
  const [department, setDepartment] = useState(emptyDepartment);
  const [loadingId, setLoadingId] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadNextDepartmentId = async () => {
      try {
        const departments = await getDepartments();
        setDepartment((current) => ({
          ...current,
          _id: generateDepartmentId(departments),
        }));
      } catch (error) {
        console.error("Error generating department ID:", error);
        setDepartment((current) => ({
          ...current,
          _id: "DEP001",
        }));
      } finally {
        setLoadingId(false);
      }
    };

    loadNextDepartmentId();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createDepartment(department);
      navigate("/departments");
    } catch (error) {
      console.error("Fetch Error:", error);
      alert(error.message || "Server error. Please try again.");
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-md bg-white p-8 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold">Add Department</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Department ID</label>
          <input
            type="text"
            name="_id"
            value={department._id}
            readOnly
            placeholder={loadingId ? "Generating..." : "Department ID"}
            className="mt-1 w-full cursor-not-allowed border bg-gray-100 p-2 text-gray-600"
            required
          />
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium text-gray-700">
            Department Name
          </label>
          <input
            type="text"
            name="dep_name"
            value={department.dep_name}
            onChange={handleChange}
            placeholder="Department Name"
            className="mt-1 w-full rounded-md border border-gray-300 p-2"
            required
          />
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={department.description}
            onChange={handleChange}
            placeholder="Description"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            rows="4"
          />
        </div>

        <button
          type="submit"
          disabled={loadingId}
          className="mt-6 w-full rounded bg-[#3f3d9c] px-4 py-2 font-bold text-white hover:bg-[#2e2c7a]"
        >
          {loadingId ? "Generating ID..." : "Add Department"}
        </button>
      </form>
    </div>
  );
};

export default AddDepartment;
