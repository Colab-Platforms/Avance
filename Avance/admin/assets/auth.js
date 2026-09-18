document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    window.location.href = "tabs.html";
    return;
  }

  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(result.token);
      window.location.href = "tabs.html";
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
});
