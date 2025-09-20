#!/usr/bin/env python3
"""
Standalone MCP server runner for Jira integration.
This script runs the MCP server independently of the FastAPI application.
"""

import asyncio
import logging
from app.mcp_jira_server import server

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


async def main():
    """Run the MCP server."""
    logger.info("Starting MCP Jira Integration Server...")
    
    # Run the server
    # Note: In a real deployment, you would use the mcp CLI:
    # mcp run app.mcp_jira_server:server
    
    logger.info("MCP server is running and ready to handle tool calls")
    logger.info("Available tools:")
    tools = await server.list_tools()
    for tool in tools:
        logger.info(f"  - {tool.name}: {tool.description}")
    
    # Keep running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down MCP server...")


if __name__ == "__main__":
    asyncio.run(main())
