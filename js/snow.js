const snowContainer = document.getElementById("snow-container");
const SNOWFLAKES = 150; // keep low for performance

for (let i = 0; i < SNOWFLAKES; i++) {
  const snowflake = document.createElement("div");
  snowflake.className = "snowflake";

  const size = Math.random() * 3 + 1;
  snowflake.style.width = `${size}px`;
  snowflake.style.height = `${size}px`;
  snowflake.style.left = `${Math.random() * 100}vw`;
  snowflake.style.animationDuration = `${Math.random() * 10 + 10}s`;
  snowflake.style.animationDelay = `${Math.random() * 10}s`;

  snowContainer.appendChild(snowflake);
}
