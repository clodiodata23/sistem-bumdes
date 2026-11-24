(function () {
  function revealEnterButton() {
    const button = document.getElementById("welcomeEnterButton");
    if (button) button.classList.add("ready");
  }
  window.enterBumdesApp = function () {
    const splash = document.getElementById("welcomeSplash");
    if (!splash || splash.classList.contains("hide")) return;
    splash.classList.add("hide");
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 650);
  };
  window.addEventListener("load", function () {
    // Loading indicator ditampilkan terlebih dahulu, kemudian tombol MASUK muncul.
    setTimeout(revealEnterButton, 700);
  });
  document.addEventListener("keydown", function (event) {
    const splash = document.getElementById("welcomeSplash");
    if (!splash) return;
    if (event.key === "Enter" && document.activeElement && document.activeElement.id === "welcomeEnterButton") {
      window.enterBumdesApp();
    }
  });
})();
