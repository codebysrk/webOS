function setActiveApp(appElement) {
  document.querySelectorAll(".taskbar-app").forEach((app) => {
    app.classList.remove("active");
  });
  appElement.classList.add("active");
}

function addNewApp(appList, taskbarApps) {
  // Filter out calculator and text-editor from the available apps
  const filteredAppList = appList.filter(
    (app) => app.id !== "calculator" && app.id !== "text-editor"
  );
  const currentApps = Array.from(taskbarApps.children).map(
    (app) => app.dataset.app
  );
  const availableToAdd = filteredAppList.filter(
    (app) => !currentApps.includes(app.id)
  );
  if (availableToAdd.length === 0) {
    alert("No more apps available to add!");
    return;
  }
  const randomApp =
    availableToAdd[Math.floor(Math.random() * availableToAdd.length)];
  const newAppBtn = document.createElement("button");
  newAppBtn.className = "taskbar-app";
  newAppBtn.dataset.app = randomApp.id;
  newAppBtn.textContent = randomApp.icon;
  newAppBtn.title = randomApp.name;

  newAppBtn.addEventListener("click", () => {
    setActiveApp(newAppBtn);
    alert(`Opening ${randomApp.name}...`);
  });

  taskbarApps.appendChild(newAppBtn);
}
