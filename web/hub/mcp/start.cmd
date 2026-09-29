@echo off
rem Orbit Hub MCP Server launcher (Windows).
rem Spawning node directly from MCP clients often fails with ENOENT on
rem Windows; going through cmd /c and this script is the reliable path.
rem It cds to the hub root so the server can locate .data/hub.sqlite.
cd /d "%~dp0.."
node mcp\server.mts %*
