import argparse
import sys
import socketserver
from http.server import SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):

    def end_headers(self):
        # Turn off caching
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # Turn on cross origin isolation
        # Needed for SharedArrayBuffer in the SPECTRE world
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        # Enable Cross-Origin Resource Sharing (CORS)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        super().end_headers()


if sys.version_info < (3, 7, 5):
    # Fix for WASM MIME type for older Python versions
    Handler.extensions_map['.wasm'] = 'application/wasm'

class FastServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Test local server for PyBook")
    parser.add_argument('--port', type=int, default=8001)
    args = parser.parse_args()
    port = args.port
    with FastServer(("", port), Handler) as httpd:
        print("Serving at: http://127.0.0.1:{}".format(port))
        httpd.serve_forever()
