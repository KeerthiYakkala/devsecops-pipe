"""
Example Flask Application for DevSecOps Pipeline Testing

This application demonstrates common patterns that security scanners
should detect and flag appropriately.
"""

import os
import logging
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration from environment variables (secure practice)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-only-secret-key')
app.config['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'


# In-memory storage for demo (use a real database in production)
items = []


@app.route('/')
def index():
    """Root endpoint with basic info."""
    return jsonify({
        'app': 'DevSecOps Demo API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'items': '/api/items',
            'item': '/api/items/<id>'
        }
    })


@app.route('/health')
def health():
    """Health check endpoint for container orchestration."""
    return jsonify({
        'status': 'healthy',
        'checks': {
            'app': 'ok',
            'database': 'ok'  # In production, actually check DB connection
        }
    })


@app.route('/api/items', methods=['GET'])
def get_items():
    """Get all items."""
    logger.info('Fetching all items')
    return jsonify({'items': items, 'count': len(items)})


@app.route('/api/items', methods=['POST'])
def create_item():
    """Create a new item."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    # Input validation (security best practice)
    name = data['name'][:100]  # Limit length
    description = data.get('description', '')[:500]
    
    item = {
        'id': len(items) + 1,
        'name': name,
        'description': description
    }
    items.append(item)
    
    logger.info(f'Created item: {item["id"]}')
    return jsonify(item), 201


@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Get a specific item by ID."""
    item = next((i for i in items if i['id'] == item_id), None)
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    return jsonify(item)


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete an item by ID."""
    global items
    original_count = len(items)
    items = [i for i in items if i['id'] != item_id]
    
    if len(items) == original_count:
        return jsonify({'error': 'Item not found'}), 404
    
    logger.info(f'Deleted item: {item_id}')
    return jsonify({'message': 'Item deleted'}), 200


# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal error: {error}')
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = app.config['DEBUG']
    
    logger.info(f'Starting application on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
