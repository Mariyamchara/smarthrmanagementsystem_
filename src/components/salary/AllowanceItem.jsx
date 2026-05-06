import React from 'react';

function AllowanceItem({ item, index, updateAllowance }) {

  return (

    <tr>

      <td>{item.name}</td>

      <td>

        <input
          type="number"
          value={item.amount}
          onChange={(e) =>
            updateAllowance(index, e.target.value)
          }
        />

      </td>

    </tr>

  );
}

export default AllowanceItem;