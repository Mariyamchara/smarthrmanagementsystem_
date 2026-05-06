import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getDepartmentById,
  updateDepartment,
} from "../../lib/departmentsApi";

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState({
    dep_name: "",
    description: "",
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const data = await getDepartmentById(id);
        setDepartment({
          dep_name: data.dep_name || "",
          description: data.description || "",
        });
      } catch (error) {
        console.error("Error fetching department:", error);
        alert(error.message || "Failed to load department");
      }
    };

    fetchDepartment();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateDepartment(id, department);
      navigate("/departments");
    } catch (error) {
      console.error("Error updating department:", error);
      alert(error.message || "Failed to update department");
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded bg-white p-8 shadow">
      <h2 className="mb-6 text-center text-2xl font-bold">Edit Department</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Department Name</label>
          <input
            type="text"
            name="dep_name"
            value={department.dep_name}
            onChange={handleChange}
            className="mt-1 w-full border p-2"
            required
          />
        </div>

        <div className="mt-3">
          <label>Description</label>
          <textarea
            name="description"
            value={department.description}
            onChange={handleChange}
            className="mt-1 w-full border p-2"
          />
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded bg-[#3f3d9c] py-2 text-white"
        >
          Update Department
        </button>
      </form>
    </div>
  );
};

export default EditDepartment;
