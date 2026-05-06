import { useState } from "react";

function EditSalaryForm({ employee, onSave, onCancel }) {

  const [basic, setBasic] = useState(employee.basic || 0);
  const [allowance, setAllowance] = useState(employee.allowance || 0);

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedEmployee = {
      ...employee,
      basic: Number(basic),
      allowance: Number(allowance)
    };

    onSave(updatedEmployee);
  };

  return (
    <div className="modal-overlay">

      <div className="modal">

        <h3>Edit Salary</h3>

        <form onSubmit={handleSubmit}>

          <div>
            <label>Basic Salary</label>
            <input
              type="number"
              value={basic}
              onChange={(e) => setBasic(e.target.value)}
            />
          </div>

          <div>
            <label>Allowance</label>
            <input
              type="number"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
            />
          </div>

          <br />

          <button className="btn-teal" type="submit">
            Save
          </button>

          <button
            type="button"
            className="btn-teal"
            onClick={onCancel}
          >
            Cancel
          </button>

        </form>

      </div>

    </div>
  );
}

export default EditSalaryForm;
