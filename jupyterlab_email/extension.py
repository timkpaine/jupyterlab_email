import json
from getpass import getpass
from notebook.base.handlers import IPythonHandler
from notebook.utils import url_path_join


class EmailHandler(IPythonHandler):
    def initialize(self, emails=None):
        self.emails = emails

    def get(self):
        email = self.get_argument('email', '')
        if email in self.emails:
            res = self.emails[email](self.request)
            self.finish(res)
        else:
            self.finish('')

    def post(self):
        email = self.get_argument('email', '')
        if email in self.emails:
            res = self.emails[email](self.request)
            self.finish(res)
        else:
            self.finish('')


class EmailsListHandler(IPythonHandler):
    def initialize(self, emails=None):
        self.emails = emails

    def get(self):
        self.finish(json.dumps(self.emails))


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    emails = nb_server_app.config.get('JupyterLabEmail', {}).get('smtp_servers', {})

    base_url = web_app.settings['base_url']

    host_pattern = '.*$'
    print(base_url)
    print('Installing jupyterlab_email handler on path %s' % url_path_join(base_url, 'emails/get'))
    print('Available email servers: %s' % ','.join(k['name'] for k in emails))

    for k in emails:
        if 'password' in k:
            print('WARNING!!! You should not store your password in jupyter_notebook_config.py!!!')
        else:
            k['password'] = getpass('Input password for %s@%s' % (k['username'], k['name']))
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/get'), EmailsListHandler, {'emails': emails})])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/run'), EmailHandler, {'emails': emails})])
