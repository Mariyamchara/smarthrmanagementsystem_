import { useEffect, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import { formatDate, getInitials } from "./employeeUtils";
import {
  getEmployeeProfile,
  updateEmployeeProfile,
} from "../../lib/employeeProfileApi";
import { setStoredEmployeeSession } from "../../lib/employeeSession";

const emptyProfile = {
  name: "",
  phone: "",
  email: "",
  address: "",
  designation: "",
  departmentName: "",
  employeeId: "",
  manager: "",
  image: "",
  createdAt: "",
};

export default function Profile() {
  const session = useEmployeeSession();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const data = await getEmployeeProfile(session.employeeId);
        if (!isActive) {
          return;
        }

        setProfile({ ...emptyProfile, ...data });
        setError("");
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load employee profile");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((current) => ({ ...current, image: reader.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.employeeId) {
      return;
    }

    try {
      const updated = await updateEmployeeProfile(session.employeeId, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        image: profile.image,
      });

      setProfile({ ...emptyProfile, ...updated });
      setStoredEmployeeSession({
        ...(session || {}),
        ...updated,
        departmentName: updated.departmentName,
      });
      setIsEditing(false);
      setError("");
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Profile</h2>
            <p>Manage your basic information and view your job details.</p>
          </div>
        </section>

        {error && <p className="form-message danger">{error}</p>}
        {successMessage && <p className="form-message success">{successMessage}</p>}

        {loading ? (
          <div className="panel">
            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="grid-2">
            <div className="panel">
              <div className="profile-photo-row">
                <div className="profile-photo">
                  {profile.image ? (
                    <img src={profile.image} alt="Employee profile" />
                  ) : (
                    <span>{getInitials(profile.name)}</span>
                  )}
                </div>

                <div>
                  <h3>{profile.name}</h3>
                  <p className="muted">{profile.designation || "Employee"}</p>
                  <label className="btn btn-outline profile-upload">
                    Change Photo
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <div className="section-title">
                <h3>Basic Information</h3>
                {!isEditing && (
                  <button className="btn btn-outline" type="button" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="field">
                    <label>Full Name</label>
                    <input name="name" value={profile.name} onChange={handleChange} disabled={!isEditing} />
                  </div>
                  <div className="field">
                    <label>Phone Number</label>
                    <input name="phone" value={profile.phone || ""} onChange={handleChange} disabled={!isEditing} />
                  </div>
                  <div className="field">
                    <label>Email Address</label>
                    <input name="email" type="email" value={profile.email} onChange={handleChange} disabled={!isEditing} />
                  </div>
                  <div className="field">
                    <label>Address</label>
                    <input name="address" value={profile.address || ""} onChange={handleChange} disabled={!isEditing} />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSuccessMessage("");
                      }}
                    >
                      Cancel
                    </button>
                    <button className="btn" type="submit">
                      Save
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="panel">
              <h3>Job Information</h3>
              <p className="muted">These details are managed by HR.</p>

              <div className="grid-2">
                {[
                  { key: "Employee ID", value: profile.employeeId },
                  { key: "Department", value: profile.departmentName || "-" },
                  { key: "Designation", value: profile.designation || "-" },
                  { key: "Joining Date", value: formatDate(profile.createdAt) },
                  { key: "Manager", value: profile.manager || "-" },
                  { key: "Role", value: profile.role || "Employee" },
                ].map((item) => (
                  <div className="field" key={item.key}>
                    <label>{item.key}</label>
                    <div className="readonly-box">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
