podman exec -it chat-postgres psql -U chatuser -d postgres

podman exec chat-postgres psql -U chatuser -d chatdb -c "SELECT * FROM threads;"

podman exec chat-postgres psql -U chatuser -d chatdb -c "SELECT * from conversations LIMIT 3"

add agents components with diagram for the agents to accomplish a task

agent A/B
- Break down each follow up in terms of request and the context the request was made in then make adjustments in future
    - If the user is asking for the code, just write the code keep it minimal; based on previous user behaviour
    - If the user is asking a general question then give long answers or give examples based on user requests

- Track model shifts based on category