import app from "../api/index.js";

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Local development server running on http://localhost:${port}`);
});
