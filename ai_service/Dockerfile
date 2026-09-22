# Use the same Python version you have locally (3.12 based on your previous logs)
FROM python:3.12-slim-bookworm

# Copy the pre-compiled uv binary from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory
WORKDIR /app

# Enable bytecode compilation for faster startup
ENV UV_COMPILE_BYTECODE=1
# Force uv to link dependencies directly into the .venv instead of caching globally in the container
ENV UV_LINK_MODE=copy

# Step 1: Install dependencies (Layer Caching)
# Copy ONLY the lockfile and pyproject.toml first.
# This ensures Docker caches your dependencies unless you add a new package.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-install-project --no-dev

# Step 2: Copy the application code
COPY src ./src

# Step 3: Install the project itself
RUN uv sync --frozen --no-dev

# Expose the standard FastAPI port
EXPOSE 8000

# Start the application using Uvicorn
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]