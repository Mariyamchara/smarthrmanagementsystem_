import { useState } from "react";
import AllowanceItem from "./AllowanceItem";

function AllowanceModel({ employee, onSave, onCancel }) {

  const [allowances, setAllowances] = useState([
    { name: "House Rent", amount: Number(employee.allowance || 0) },
    { name: "Transport", amount: 0 },
    { name: "Medical", amount: 0 },
    { name: "Food", amount: 0 },
    { name: "Advance", amount: 0 },
    { name: "Bonus/Increments", amount: 0 }
  ]);

  const updateAllowance = (index, value) => {

    const updated = [...allowances];
    updated[index].amount = Number(value);

    setAllowances(updated);
  };

  const handleSave = () => {

    const total = allowances.reduce(
      (sum, item) => sum + item.amount,
      0
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

        <br/>

        <button
          className="btn-teal"
          onClick={handleSave}
        >
          Save
        </button>

        <button
          className="btn-teal"
          onClick={onCancel}
        >
          Cancel
        </button>

      </div>

    </div>
  );
}

export default AllowanceModel;
