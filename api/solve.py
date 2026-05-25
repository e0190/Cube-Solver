from http.server import BaseHTTPRequestHandler
import json
import rubik_solver.utils as utils

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            cube_string = data.get('cube', '')

            if len(cube_string) != 54:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Incomplete data maps received'}).encode('utf-8'))
                return

            # Compute the Kociemba algorithm matrix solution paths
            solution = utils.solve(cube_string, 'Kociemba')
            move_list = [str(move) for move in solution]

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'moves': move_list}).encode('utf-8'))

        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid layout configuration. Check corner/edge pairs.'}).encode('utf-8'))
