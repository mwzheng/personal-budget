#!/bin/sh
# Replace Copilot co-author trailers with actual user
sed -E 's/Co-authored-by: Copilot .*/Co-authored-by: mwzheng <mickey.zheng@yahoo.com>/g'