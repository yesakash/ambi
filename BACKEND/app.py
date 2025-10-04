import os
import uuid

import joblib
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
)
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score, r2_score, precision_score, recall_score, 
    f1_score, log_loss, mean_squared_error
)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC, SVR, LinearSVC, LinearSVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
import numpy as np

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
MODEL_FOLDER = "models"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MODEL_FOLDER"] = MODEL_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODEL_FOLDER, exist_ok=True)

tasks = {}

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files or request.files["file"].filename == "":
        return jsonify({"error": "No file selected"}), 400
    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported"}), 400

    task_id = str(uuid.uuid4())
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], f"{task_id}.csv")
    file.save(filepath)
    tasks[task_id] = {"filepath": filepath, "filename": file.filename}
    return jsonify({"status": "success", "task_id": task_id})


@app.route("/preview/<task_id>", methods=["GET"])
def preview_csv(task_id):
    task_info = tasks.get(task_id)
    if not task_info:
        return jsonify({"error": "Task not found. Please upload a file again."}), 404
    filepath = task_info["filepath"]
    df = pd.read_csv(filepath)
    preview_rows = int(request.args.get("preview_rows", 10))
    preview_cols = int(request.args.get("preview_cols", 5))
    target_column = request.args.get("target")
    preview_cols = min(preview_cols, len(df.columns))
    preview_cols_list = df.columns[:preview_cols].tolist()
    if target_column and target_column in df.columns and target_column not in preview_cols_list:
        preview_cols_list.append(target_column)
    df_preview = df[preview_cols_list].head(preview_rows)
    return jsonify({
        "headers": df_preview.columns.tolist(),
        "rows": df_preview.values.tolist(),
        "target_column": target_column,
        "preview_rows": preview_rows,
        "preview_cols": len(preview_cols_list),
    })


@app.route("/train", methods=["POST"])
def train():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    task_id = data.get("task_id")
    target_column = data.get("target_column")
    selected_models = data.get("models")

    if not task_id or task_id not in tasks:
        return jsonify({"error": "Invalid task ID. Please upload your file again."}), 400
    if not target_column or not selected_models:
        return jsonify({"error": "Missing target column or models"}), 400

    filepath = tasks[task_id]["filepath"]

    try:
        df = pd.read_csv(filepath)
        if target_column not in df.columns:
            return jsonify({"error": f"Target column '{target_column}' not found in dataset."}), 400

        y = df[target_column]
        X = df.drop(columns=[target_column])
        X = X.select_dtypes(include=["number"]).fillna(0)

        # Task detection
        if y.dtype.kind in "biufc":  # numeric
            if y.nunique() <= 20:
                is_regression = False
            else:
                is_regression = True
        else:
            is_regression = False

        # Encode target for classification
        label_encoder = None
        if not is_regression:
            label_encoder = LabelEncoder()
            y = label_encoder.fit_transform(y.astype(str))

        if is_regression:
            metric_name = "R² Score"
            AVAILABLE_MODELS = {
                "Linear Regression": LinearRegression(),
                "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42),
                "Support Vector Regressor (Slow)": SVR(),
                "Support Vector Regressor": SVR(),  # Accept without (Slow)
                "Linear Support Vector Regressor (Fast)": LinearSVR(max_iter=2000, random_state=42),
                "Linear Support Vector Regressor": LinearSVR(max_iter=2000, random_state=42),  # Accept without (Fast)
                "Decision Tree Regressor": DecisionTreeRegressor(random_state=42),
                "Gradient Boosting Regressor": GradientBoostingRegressor(random_state=42),
                "K-Nearest Neighbors Regressor": KNeighborsRegressor(),
                "MLP Regressor": MLPRegressor(max_iter=1000, random_state=42),
            }
        else:
            metric_name = "Accuracy"
            AVAILABLE_MODELS = {
                "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
                "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
                "Support Vector Machine (Slow)": SVC(kernel="rbf", probability=True, random_state=42),
                "Support Vector Machine": SVC(kernel="rbf", probability=True, random_state=42),  # Accept without (Slow)
                "Linear Support Vector Machine (Fast)": LinearSVC(max_iter=2000, random_state=42, dual='auto'),
                "Linear Support Vector Machine": LinearSVC(max_iter=2000, random_state=42, dual='auto'),  # Accept without (Fast)
                "Decision Tree Classifier": DecisionTreeClassifier(random_state=42),
                "Gradient Boosting Classifier": GradientBoostingClassifier(random_state=42),
                "K-Nearest Neighbors": KNeighborsClassifier(),
                "MLP Classifier": MLPClassifier(max_iter=1000, random_state=42),
            }

        # Filter valid models
        valid_models = [m for m in selected_models if m in AVAILABLE_MODELS]
        if not valid_models:
            return jsonify({"error": "No valid models for the detected task type."}), 400

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        results = []
        for model_name in valid_models:
            model = AVAILABLE_MODELS[model_name]
            try:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                if is_regression:
                    # Regression metrics
                    score = r2_score(y_test, y_pred)
                    mse = mean_squared_error(y_test, y_pred)
                    rmse = np.sqrt(mse)
                    
                    results.append({
                        "name": model_name,
                        "score": float(score),
                        "r2": float(score),
                        "mse": float(mse),
                        "rmse": float(rmse),
                        "loss": float(mse),
                        "download_path": f"{task_id}_{model_name.replace(' ', '_').replace('(', '').replace(')', '')}.pkl",
                    })
                else:
                    # Classification metrics
                    score = accuracy_score(y_test, y_pred)
                    
                    # Handle models that don't support predict_proba (like LinearSVC)
                    try:
                        if hasattr(model, 'predict_proba'):
                            y_pred_proba = model.predict_proba(X_test)
                            loss = log_loss(y_test, y_pred_proba)
                        else:
                            # For models without predict_proba, use a simple error metric
                            loss = 1 - score
                    except:
                        loss = 1 - score
                    
                    # Calculate precision, recall, f1 with averaging
                    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
                    
                    results.append({
                        "name": model_name,
                        "score": float(score),
                        "accuracy": float(score),
                        "precision": float(precision),
                        "recall": float(recall),
                        "f1": float(f1),
                        "loss": float(loss),
                        "download_path": f"{task_id}_{model_name.replace(' ', '_').replace('(', '').replace(')', '')}.pkl",
                    })
                
                # Save model
                model_filename = f"{task_id}_{model_name.replace(' ', '_').replace('(', '').replace(')', '')}.pkl"
                joblib.dump(model, os.path.join(app.config["MODEL_FOLDER"], model_filename))
                
            except Exception as e:
                print(f"Error training model {model_name}: {e}")
                results.append({
                    "name": model_name,
                    "score": "ERROR",
                    "error": str(e),
                    "download_path": None,
                })

        # Sort by score (ignore errors)
        results.sort(key=lambda x: float(x["score"]) if x["score"] != "ERROR" else -1, reverse=True)

        tasks[task_id]["results"] = results
        tasks[task_id]["metric"] = metric_name
        tasks[task_id]["is_regression"] = is_regression

        return jsonify({
            "status": "success",
            "task_id": task_id,
            "results": results,
            "metric": metric_name,
            "is_regression": is_regression
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/results/<task_id>", methods=["GET"])
def results(task_id):
    task_data = tasks.get(task_id)
    if not task_data or "results" not in task_data:
        return jsonify({"error": "No results found for this task."}), 404
    return jsonify({
        "results": task_data["results"],
        "metric": task_data["metric"],
        "task_id": task_id,
        "is_regression": task_data.get("is_regression", False)
    })


@app.route("/download/<path:filename>", methods=["GET"])
def download_model(filename):
    return send_from_directory(app.config["MODEL_FOLDER"], filename, as_attachment=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)