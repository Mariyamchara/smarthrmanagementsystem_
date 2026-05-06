import React from "react";

const EmSettingsCard = ({ title, description, preview, onClick }) => {
  return (
    <button type="button" onClick={onClick} className="settings-card">
      <span className="settings-card-icon">{title.charAt(0)}</span>

      <span className="settings-card-body">
        <strong>{title}</strong>
        <span>{description}</span>
        {preview && <small>{preview}</small>}
      </span>

      <span className="settings-card-action">Manage</span>
    </button>
  );
};

export default EmSettingsCard;
