use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeaveRecord {
    pub id: i64,
    pub employee_id: i64,
    pub leave_type: String,
    pub leave_date: String,
    pub reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeaveSummary {
    pub leave_type: String,
    pub allocated: i64,
    pub used: i64,
    pub remaining: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmployeeDetail {
    pub employee: Employee,
    pub leave_records: Vec<LeaveRecord>,
    pub leave_summary: Vec<LeaveSummary>,
}

struct DbState(Mutex<Connection>);

fn init_db(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
        CREATE TABLE IF NOT EXISTS leave_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            leave_type TEXT NOT NULL,
            leave_date TEXT NOT NULL,
            reason TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );",
    )
}

#[tauri::command]
fn get_employees(state: State<DbState>) -> Result<Vec<Employee>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, created_at FROM employees ORDER BY name COLLATE NOCASE")
        .map_err(|e| e.to_string())?;
    let employees = stmt
        .query_map([], |row| {
            Ok(Employee {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<SqlResult<Vec<_>>>()
        .map_err(|e| e.to_string())?;
    Ok(employees)
}

#[tauri::command]
fn create_employee(name: String, state: State<DbState>) -> Result<Employee, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO employees (name) VALUES (?1)",
        params![name.trim()],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, name, created_at FROM employees WHERE id = ?1",
        params![id],
        |row| {
            Ok(Employee {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_employee(id: i64, name: String, state: State<DbState>) -> Result<Employee, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE employees SET name = ?1 WHERE id = ?2",
        params![name.trim(), id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, name, created_at FROM employees WHERE id = ?1",
        params![id],
        |row| {
            Ok(Employee {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_employee(id: i64, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM leave_records WHERE employee_id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM employees WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_employee_detail(
    id: i64,
    year: i32,
    state: State<DbState>,
) -> Result<EmployeeDetail, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let employee = conn
        .query_row(
            "SELECT id, name, created_at FROM employees WHERE id = ?1",
            params![id],
            |row| {
                Ok(Employee {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, employee_id, leave_type, leave_date, reason, created_at
             FROM leave_records WHERE employee_id = ?1 ORDER BY leave_date DESC",
        )
        .map_err(|e| e.to_string())?;
    let leave_records = stmt
        .query_map(params![id], |row| {
            Ok(LeaveRecord {
                id: row.get(0)?,
                employee_id: row.get(1)?,
                leave_type: row.get(2)?,
                leave_date: row.get(3)?,
                reason: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<SqlResult<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    let allocations = [("annual", 15i64), ("sick", 10i64), ("casual", 5i64)];
    let year_str = year.to_string();
    let mut leave_summary = Vec::new();
    for (leave_type, allocated) in &allocations {
        let used: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM leave_records
                 WHERE employee_id = ?1 AND leave_type = ?2 AND strftime('%Y', leave_date) = ?3",
                params![id, leave_type, &year_str],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        leave_summary.push(LeaveSummary {
            leave_type: leave_type.to_string(),
            allocated: *allocated,
            used,
            remaining: allocated - used,
        });
    }

    Ok(EmployeeDetail {
        employee,
        leave_records,
        leave_summary,
    })
}

#[tauri::command]
fn add_leave(
    employee_id: i64,
    leave_type: String,
    leave_date: String,
    reason: Option<String>,
    state: State<DbState>,
) -> Result<LeaveRecord, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let reason_val = reason.filter(|r| !r.trim().is_empty());
    conn.execute(
        "INSERT INTO leave_records (employee_id, leave_type, leave_date, reason) VALUES (?1, ?2, ?3, ?4)",
        params![employee_id, leave_type, leave_date, reason_val],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, employee_id, leave_type, leave_date, reason, created_at FROM leave_records WHERE id = ?1",
        params![id],
        |row| {
            Ok(LeaveRecord {
                id: row.get(0)?,
                employee_id: row.get(1)?,
                leave_type: row.get(2)?,
                leave_date: row.get(3)?,
                reason: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_leave(
    id: i64,
    leave_type: String,
    leave_date: String,
    reason: Option<String>,
    state: State<DbState>,
) -> Result<LeaveRecord, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let reason_val = reason.filter(|r| !r.trim().is_empty());
    conn.execute(
        "UPDATE leave_records SET leave_type = ?1, leave_date = ?2, reason = ?3 WHERE id = ?4",
        params![leave_type, leave_date, reason_val, id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, employee_id, leave_type, leave_date, reason, created_at FROM leave_records WHERE id = ?1",
        params![id],
        |row| {
            Ok(LeaveRecord {
                id: row.get(0)?,
                employee_id: row.get(1)?,
                leave_type: row.get(2)?,
                leave_date: row.get(3)?,
                reason: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_leave(id: i64, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM leave_records WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_path = app
                .path()
                .app_local_data_dir()
                .expect("Failed to get app data dir")
                .join("leave_tracker.db");
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent).expect("Failed to create data dir");
            }
            let conn = Connection::open(&db_path).expect("Failed to open database");
            init_db(&conn).expect("Failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_employees,
            create_employee,
            update_employee,
            delete_employee,
            get_employee_detail,
            add_leave,
            update_leave,
            delete_leave,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
