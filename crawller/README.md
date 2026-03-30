# Crawller

A distributed and AI-powered web crawler built with [Bun](https://bun.sh), [Puppeteer](https://pptr.dev), [BullMQ](https://docs.bullmq.io), and [MongoDB](https://www.mongodb.com).

## Features

-   **High-Performance Execution:** Powered by Bun's fast JavaScript runtime.
-   **Distributed Task Management:** Uses BullMQ and Redis for scalable, reliable job queuing.
-   **Headless Browsing:** Puppeteer integration for crawling dynamic, JavaScript-heavy websites.
-   **Efficient HTML Parsing:** Cheerio for fast data extraction from static content.
-   **AI-Enhanced Extraction:** Integration with Google's Gemini AI for intelligent content processing and data synthesis.
-   **Data Persistence:** Mongoose-based ODM for structured data storage in MongoDB.
-   **Docker Ready:** Simple infrastructure management with `docker-compose`.

## Prerequisites

-   [Bun](https://bun.sh) (v1.x or later)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine (for running Redis and MongoDB)

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/crawller.git
    cd crawller
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and configure the following:
    ```env
    MONGODB_URI=mongodb://localhost:27017/crawler
    REDIS_HOST=localhost
    REDIS_PORT=6379
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  Start infrastructure:
    ```bash
    docker-compose up -d
    ```

## Usage

### Start the Crawler
The main entry point starts the crawler and worker processes:
```bash
bun start
```

### Utility Scripts
-   **Check DB Connection:** `bun run check_db.ts`
-   **Test Gemini AI:** `bun run test_gemini.ts`
-   **Force Gemini Processing:** `bun run force_gemini.ts`

## Project Structure

-   `src/crawler.ts`: Core web crawling and navigation logic using Puppeteer/Cheerio.
-   `src/queue.ts`: Configuration for BullMQ queues and job producers.
-   `src/worker.ts`: Background job consumers that execute crawling tasks.
-   `src/db.ts`: MongoDB connection management.
-   `src/models/Page.ts`: Mongoose schema for crawled page data.
-   `index.ts`: Application entry point.

## License

MIT
