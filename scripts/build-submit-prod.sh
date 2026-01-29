# Run this script using `nohup ./build-submit-prod.sh > build.log 2>&1 &`
# to ensure it continues even if you close your terminal session.
# Each build+submit runs in the background so submissions do not block
# the rest of the commands.

# numy

just build-submit numy prod &
wait
