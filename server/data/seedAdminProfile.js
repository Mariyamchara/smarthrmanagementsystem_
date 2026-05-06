const seedAdminProfile = [
  {
    profileId: "admin",
    name: "Admin User",
    username: "admin",
    email: "smarthrmanagement6@gmail.com",
    phone: "+92 300 1234567",
    title: "HR Administrator",
    dept: "Human Resources",
    location: "Office",
    image: "",
    password: "admin@123",
    permissions: {
      employees: true,
      leaves: true,
      settings: true,
      salary: true,
    },
  },
];

export default seedAdminProfile;
