"use strict";

let watchedGenreChartHomeInstance = null;

function chartLegendStyle() {
  return {
    labels: {
      color: "#dbe6ff",
      usePointStyle: true,
      boxWidth: 9,
      font: { family: "Inter" }
    }
  };
}

function buildGenreCount(list) {
  const count = {};
  list.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      count[genre] = (count[genre] || 0) + 1;
    });
  });
  return count;
}

function renderGenreDoughnutTarget(count, target, existingInstance, colors) {
  const wrap = document.getElementById(target.wrapId);
  const empty = document.getElementById(target.emptyId);
  const canvas = document.getElementById(target.canvasId);
  if (!wrap || !empty || !canvas) return existingInstance;

  const labels = Object.keys(count);
  const values = Object.values(count);

  if (!labels.length) {
    if (existingInstance) existingInstance.destroy();
    wrap.classList.add("hidden");
    empty.classList.remove("hidden");
    return null;
  }

  wrap.classList.remove("hidden");
  empty.classList.add("hidden");
  if (existingInstance) existingInstance.destroy();

  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    },
    options: {
      cutout: "64%",
      maintainAspectRatio: false,
      animation: { duration: 750, easing: "easeOutQuart" },
      plugins: {
        legend: chartLegendStyle(),
        tooltip: {
          backgroundColor: "#1a2338",
          borderColor: "rgba(255,255,255,0.14)",
          borderWidth: 1,
          cornerRadius: 10
        }
      }
    }
  });
}

function renderWatchedGenreChart(completedList) {
  const count = buildGenreCount(completedList);
  const colors = ["#5b8dff", "#6fc7ff", "#39d98a", "#8ca9ff", "#9cc9ff", "#7fd5b0", "#7f8fff", "#5ca4ff"];

  watchedGenreChartHomeInstance = renderGenreDoughnutTarget(
    count,
    { wrapId: "watchedGenreChartHomeWrap", emptyId: "watchedGenreHomeEmptyText", canvasId: "watchedGenreChartHome" },
    watchedGenreChartHomeInstance,
    colors
  );
}
