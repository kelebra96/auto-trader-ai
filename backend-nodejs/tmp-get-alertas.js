const axios = require("axios");

(async () => {
  try {
    console.log("Fazendo login com usuário de teste...");
    const login = await axios.post("http://localhost:3001/api/auth/login", {
      email: "testuser@example.com",
      senha: "password123",
    });
    console.log("login.status", login.status);
    const token = login.data?.data?.token || login.data?.token;
    console.log(
      "token (preview):",
      token ? token.slice(0, 40) + "..." : "nenhum token"
    );

    console.log("\nChamando GET /api/alertas com token...");
    const res = await axios.get("http://localhost:3001/api/alertas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("alertas.status", res.status);
    console.log(
      "alertas.body:",
      JSON.stringify(res.data, null, 2).slice(0, 4000)
    );
  } catch (e) {
    if (e.response) {
      console.error("Erro HTTP", e.response.status);
      try {
        console.error(JSON.stringify(e.response.data, null, 2));
      } catch (_) {
        console.error(e.response.data);
      }
    } else {
      console.error("Erro", e.stack || e.message);
    }
    process.exit(1);
  }
})();
