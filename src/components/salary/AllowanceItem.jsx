import React from "react";

function AllowanceItem({ item, index, updateAllowance }) {
  return (
    <tr>
      <td>{item.name}</td>

      <td>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={item.amount}
          onChange={(e) => updateAllowance(index, e.target.value)}
          placeholder="0"
        />
      </td>
    </tr>
  );
}

export default AllowanceItem;
