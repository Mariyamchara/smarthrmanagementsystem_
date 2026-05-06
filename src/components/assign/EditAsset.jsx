import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { assetsApi } from "../../lib/assetsApi";

const createEmptyItem = () => ({
  name: "",
  serialNumber: "",
  liabilityAmount: 0,
  status: "Assigned",
});

const EditAsset = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState({
    employeeName: "",
    assignedDate: "",
    assets: [createEmptyItem()],
  });

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const data = await assetsApi.getById(id);
        setAsset({
          employeeName: data.employeeName || "",
          assignedDate: data.assignedDate ? data.assignedDate.slice(0, 10) : "",
          assets: data.assets?.length ? data.assets : [createEmptyItem()],
        });
      } catch (error) {
        console.error("Failed to load asset:", error);
      }
    };

    loadAsset();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAsset((current) => ({ ...current, [name]: value }));
  };

  const handleAssetChange = (index, field, value) => {
    setAsset((current) => ({
      ...current,
      assets: current.assets.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addAssetField = () => {
    setAsset((current) => ({ ...current, assets: [...current.assets, createEmptyItem()] }));
  };

  const removeAssetField = (index) => {
    setAsset((current) => ({
      ...current,
      assets: current.assets.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await assetsApi.update(id, {
        employeeName: asset.employeeName,
        assignedDate: asset.assignedDate,
        assets: asset.assets.filter((item) => item.name.trim() !== ""),
      });
      navigate("/assets");
    } catch (error) {
      console.error("Failed to update asset:", error);
      alert(error.message || "Failed to update asset");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-8 shadow rounded">
      <h2 className="text-xl font-bold mb-4 text-center">Edit Assets</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="employeeName"
          value={asset.employeeName}
          onChange={handleChange}
          className="w-full mb-3 p-2 border"
          placeholder="Employee name"
        />

        <input
          type="date"
          name="assignedDate"
          value={asset.assignedDate}
          onChange={handleChange}
          className="w-full mb-3 p-2 border"
        />

        <label className="font-medium">Assets</label>

        {asset.assets.map((item, index) => (
          <div key={`${index}-${item.name}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <input
              type="text"
              value={item.name}
              onChange={(event) => handleAssetChange(index, "name", event.target.value)}
              className="p-2 border"
              placeholder="Asset name"
            />
            <input
              type="text"
              value={item.serialNumber}
              onChange={(event) => handleAssetChange(index, "serialNumber", event.target.value)}
              className="p-2 border"
              placeholder="Serial number"
            />
            <input
              type="number"
              value={item.liabilityAmount}
              onChange={(event) =>
                handleAssetChange(index, "liabilityAmount", Number(event.target.value))
              }
              className="p-2 border"
              placeholder="Liability"
            />
            <div className="flex gap-2">
              <select
                value={item.status}
                onChange={(event) => handleAssetChange(index, "status", event.target.value)}
                className="w-full p-2 border"
              >
                <option>Assigned</option>
                <option>Returned</option>
                <option>Not Returned</option>
              </select>
              {asset.assets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAssetField(index)}
                  className="bg-red-500 text-white px-3 rounded"
                >
                  X
                </button>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={addAssetField} className="bg-blue-500 text-white px-3 py-1 mb-3 rounded">
          + Add Asset
        </button>

        <button className="w-full bg-[#3f3d9c] text-white py-2 rounded">Update</button>
      </form>
    </div>
  );
};

export default EditAsset;
