import pytest

def test_get_tasks_and_seed(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 10
    assert "items" in data
    assert data["items"][0]["title"] is not None

def test_create_and_update_task(client):
    new_task = {
        "title": "Build Prometheus & Grafana Metrics Exporter",
        "description": "Expose /metrics endpoint for Prometheus metrics scraping.",
        "category": "performance",
        "difficulty": "medium",
        "points": 20
    }
    create_res = client.post("/api/tasks", json=new_task)
    assert create_res.status_code == 201
    task_data = create_res.json()
    task_id = task_data["id"]
    assert task_data["status"] == "todo"

    # Mark completed
    update_res = client.patch(f"/api/tasks/{task_id}", json={"status": "completed"})
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "completed"
    assert updated_data["completed_at"] is not None

    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 204
