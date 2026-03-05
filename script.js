document.addEventListener("DOMContentLoaded", function () {
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const body = document.body;

  const allPages = document.querySelectorAll(".full-page");
  const messCouponPage = document.getElementById("mess-coupon-page");
  const backFromMess = document.getElementById("back-to-dashboard-from-mess");
  const backFromPass = document.getElementById("back-to-dashboard-from-pass");

  const notificationIcon = document.querySelector(".notification-icon");
  const sidebarProfileLink = document.getElementById("sidebar-profile-link");
  const messScannerLink = document.getElementById("mess-scanner-link");
  const messScannerTile = document.getElementById("mess-scanner-tile");

  const sidebarSearchInput = document.getElementById("sidebar-search");
  const sidebarMenuItems = document.querySelectorAll(".sidebar-menu a");

  const alertModal = document.getElementById("alert-modal");
  const alertModalMessage = document.getElementById("alert-modal-message");
  const alertModalOkBtn = document.getElementById("alert-modal-ok-btn");

  let countdownInterval;
  let codeReader = null;
  let videoStream = null;

  // Hamburger toggle
  hamburgerMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
    body.classList.toggle("sidebar-open");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    body.classList.remove("sidebar-open");
  });

  // Sidebar search filter
  sidebarSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    sidebarMenuItems.forEach((item) => {
      const itemText = item.textContent.toLowerCase();
      item.style.display = itemText.includes(searchTerm) ? "flex" : "none";
    });
  });

  // Custom alert functions
  function showCustomAlert(message) {
    alertModalMessage.textContent = message;
    alertModal.classList.remove("hidden");
  }
  function hideCustomAlert() {
    alertModal.classList.add("hidden");
  }
  alertModalOkBtn.addEventListener("click", hideCustomAlert);
  alertModal.addEventListener("click", (e) => {
    if (e.target === alertModal) hideCustomAlert();
  });

  // Show/hide pages
  function showPage(pageToShow) {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    body.classList.remove("sidebar-open");

    allPages.forEach((p) => p.classList.add("hidden"));
    document.querySelector(".main-header").classList.add("hidden");
    document.querySelector(".main-content").classList.add("hidden");
    document.querySelector(".bottom-nav").classList.add("hidden");

    pageToShow.classList.remove("hidden");
  }

  function hideAllPages() {
    stopCamera();
    clearInterval(countdownInterval);

    const acceptedVideo = document.getElementById("accepted-video");
    if (acceptedVideo) {
      acceptedVideo.pause();
      acceptedVideo.currentTime = 0;
    }

    allPages.forEach((p) => p.classList.add("hidden"));
    document.querySelector(".main-header").classList.remove("hidden");
    document.querySelector(".main-content").classList.remove("hidden");
    document.querySelector(".bottom-nav").classList.remove("hidden");
  }

  // Navigation
  notificationIcon.addEventListener("click", () =>
    showPage(document.getElementById("messages-page"))
  );
  sidebarProfileLink.addEventListener("click", () =>
    showPage(document.getElementById("profile-page"))
  );

  document.querySelectorAll(".page-header .bx-arrow-back, .page-header .bx-x").forEach((btn) => {
    btn.addEventListener("click", hideAllPages);
  });
  document.querySelectorAll(".mess-coupon-header .bx-arrow-back, .mess-coupon-header .bx-x").forEach((btn) => {
    btn.addEventListener("click", hideAllPages);
  });
  if (backFromMess) backFromMess.addEventListener("click", hideAllPages);
  if (backFromPass) backFromPass.addEventListener("click", hideAllPages);

  // Mess scanner: DIRECTLY start scanner without checking tokens
  function handleMessScannerClick(e) {
    e.preventDefault();
    startScanFlow("Default Meal");
  }
  messScannerLink.addEventListener("click", handleMessScannerClick);
  messScannerTile.addEventListener("click", handleMessScannerClick);

  // Stop camera
  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      videoStream = null;
    }
    codeReader = null;
  }

  // Meal buttons
  document.querySelectorAll(".meal-button").forEach((button) => {
    button.addEventListener("click", () => {
      const mealType = button.querySelector("span").textContent;
      startScanFlow(mealType);
    });
  });

  // Scan flow
  function startScanFlow(mealType) {
    showPage(document.getElementById("camera-scanner-page"));
    codeReader = new ZXingBrowser.BrowserMultiFormatReader();

    codeReader
      .decodeOnceFromVideoDevice(undefined, "video-stream")
      .then((result) => {
        if (result) {
          navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            videoStream = stream;
          });
          console.log("Barcode detected:", result.getText());
          showLoadingAnimation(mealType);
        }
      })
      .catch((err) => {
        console.error("Camera or Scan Error:", err);
        if (err && err.name !== "NotFoundException") {
          showCustomAlert("Could not start camera. Please check permissions.");
          hideAllPages();
        }
      });
  }

  function showLoadingAnimation(mealType) {
    stopCamera();
    document.getElementById("camera-scanner-page").classList.add("hidden");
    messCouponPage.classList.remove("hidden");
    messCouponPage.classList.add("content-blurred");
    document.getElementById("loading-page").classList.remove("hidden");

    setTimeout(() => {
      document.getElementById("loading-page").classList.add("hidden");
      messCouponPage.classList.remove("content-blurred");
      messCouponPage.classList.add("hidden");
      populateAndShowMessPass(mealType);
    }, 4500);
  }

  function populateAndShowMessPass(mealType) {
    document.getElementById("pass-meal-type").textContent = mealType;
    const now = new Date();
    const dateOptions = { month: "short", day: "2-digit", year: "numeric" };
    document.getElementById("pass-date").textContent = now.toLocaleString("en-US", dateOptions).replace(/,/g, "");
    const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    document.getElementById("pass-time").textContent = now.toLocaleTimeString("en-US", timeOptions);

    showPage(document.getElementById("mess-pass-page"));

    const acceptedVideo = document.getElementById("accepted-video");
    if (acceptedVideo) {
      acceptedVideo.loop = true;
      acceptedVideo.muted = true;
      try { acceptedVideo.currentTime = 0; } catch (e) {}
      acceptedVideo.play().catch((error) => {
        console.warn("Video Autoplay Failed:", error);
      });
    }

    startCountdown();
  }

  function startCountdown() {
    clearInterval(countdownInterval);
    let seconds = 30;
    const countdownElement = document.getElementById("pass-countdown");
    countdownElement.textContent = seconds;
    countdownInterval = setInterval(() => {
      seconds--;
      countdownElement.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        countdownElement.textContent = "0";
      }
    }, 1000);
  }

  // Optional: touch scroll prevention and tiles grid elevate remain unchanged
});
