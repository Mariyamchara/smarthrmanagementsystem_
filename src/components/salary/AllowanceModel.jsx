import { useState } from "react";
import AllowanceItem from "./AllowanceItem";

function AllowanceModel({ employee, onSave, onCancel }) {
  const [allowances, setAllowances] = useState([
    { name: "House Rent", amount: String(Number(employee.allowance || 0)) },
    { name: "Transport", amount: "" },
    { name: "Medical", amount: "" },
    { name: "Food", amount: "" },
    { name: "Advance", amount: "" },
    { name: "Bonus/Increments", amount: "" },
  ]);

  const updateAllowance = (index, value) => {
    const updated = [...allowances];
    updated[index].amount = value;
    setAllowances(updated);
  };

  const handleSave = () => {
    const total = allowances.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    onSave(total);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Allowances - {employee.name}</h3>

        <table>
          <thead>
            <tr>
              <th>Allowance Type</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {allowances.map((item, index) => (
              <AllowanceItem
                key={index}
                item={item}
                index={index}
                updateAllowance={updateAllowance}
              />
            ))}
          </tbody>
        </table>

        <br />

        <button className="btn-teal" onClick={handleSave}>
          Save
        </button>

        <button className="btn-teal" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AllowanceModel;
