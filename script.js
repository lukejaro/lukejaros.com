(function () {
  var root = document.documentElement;
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var px = 0;
  var py = 0;
  var tx = 0;
  var ty = 0;
  var frame = 0;
  var listening = false;
  var pills = document.querySelectorAll(".pill");

  function paint() {
    px += (tx - px) * 0.08;
    py += (ty - py) * 0.08;
    root.style.setProperty("--px", px.toFixed(4));
    root.style.setProperty("--py", py.toFixed(4));
    if (Math.abs(tx - px) > 0.002 || Math.abs(ty - py) > 0.002) {
      frame = window.requestAnimationFrame(paint);
    } else {
      frame = 0;
    }
  }

  function onPointer(event) {
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }
    var width = window.innerWidth || 1;
    var height = window.innerHeight || 1;
    tx = (event.clientX / width) * 2 - 1;
    ty = (event.clientY / height) * 2 - 1;
    root.classList.add("is-pointer");
    if (!frame) frame = window.requestAnimationFrame(paint);

    for (var i = 0; i < pills.length; i++) {
      var rect = pills[i].getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      var hx = ((event.clientX - rect.left) / rect.width) * 100;
      var hy = ((event.clientY - rect.top) / rect.height) * 100;
      pills[i].style.setProperty("--hx", hx.toFixed(1) + "%");
      pills[i].style.setProperty("--hy", hy.toFixed(1) + "%");
    }
  }

  function syncMotion() {
    if (motion.matches) {
      root.classList.remove("is-pointer");
      root.style.removeProperty("--px");
      root.style.removeProperty("--py");
      if (listening) {
        window.removeEventListener("pointermove", onPointer);
        listening = false;
      }
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      return;
    }
    if (!listening) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      listening = true;
    }
  }

  syncMotion();
  if (typeof motion.addEventListener === "function") {
    motion.addEventListener("change", syncMotion);
  }
})();
