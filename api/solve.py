from http.server import BaseHTTPRequestHandler
import json
import rubik_solver.utils as utils

# Vercel relies on this explicit class named 'handler' to execute serverless logic
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        # Set up response baseline configurations
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        # Handle cross-origin handshakes to avoid browser blockages
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.end_headers()

        try:
            payload = json.loads(post_data.decode('utf-8'))
            cube_string = payload.get('cube', '')

            if len(cube_string) != 54:
                response = {'error': 'Incomplete data maps received. Must be exactly 54 characters.'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

            # Execute the calculation inside your chosen python library module
            solution = utils.solve(cube_string, 'Kociemba')
            move_list = [str(move) for move in solution]

            response = {'moves': move_list}
            self.wfile.write(json.dumps(response).encode('utf-8'))

        except Exception as e:
            response = {'error': f'Invalid layout arrangement profiles or unmatchable corner edge pairs.'}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

    def do_OPTIONS(self):
        # Handle preflight check requirements cleanly
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.end_headers()
