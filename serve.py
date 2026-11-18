# Staging server that mimics the production response headers (CSP etc.). Serves site/ on 127.0.0.1:18791.
import http.server, functools, os
CSP = "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
HDRS = {'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin', 'Cross-Origin-Opener-Policy': 'same-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'site')
import gzip, io
TEXT = ('.html', '.js', '.css', '.svg', '.xml', '.txt', '.json', '/')
class H(http.server.SimpleHTTPRequestHandler):
    # gzip text responses, like Cloudflare does in production (it serves br/gzip), so Lighthouse numbers are comparable
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path): path = os.path.join(path, 'index.html')
        if 'gzip' in self.headers.get('Accept-Encoding', '') and self.path.split('?')[0].endswith(TEXT) and os.path.isfile(path):
            data = gzip.compress(open(path, 'rb').read())
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(path) if not path.endswith('.html') else 'text/html; charset=utf-8')
            self.send_header('Content-Encoding', 'gzip'); self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            return io.BytesIO(data)
        return super().send_head()
    def end_headers(self):
        for k, v in HDRS.items(): self.send_header(k, v)
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 18791), functools.partial(H, directory=ROOT)).serve_forever()
