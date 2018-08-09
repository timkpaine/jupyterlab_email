import emails
import json
from getpass import getpass
from notebook.base.handlers import IPythonHandler
from notebook.utils import url_path_join


class EmailHandler(IPythonHandler):
    def initialize(self, emails=None):
        self.emails = emails

    def post(self):
        body = json.loads(self.request.body)
        email = body.get('email', '')
        code = body.get('code', False)
        to = body.get('to', '')
        subject = body.get('subject', '')
        print('\n\n\n\n\n')
        print(email)
        print('\n\n\n\n\n')
        print(self.emails)
        for account in self.emails:
            if account['name'] == email:
                if not to:
                    to = account['username'] + '@' + account['domain']
                else:
                    to = to.split(',')

                message = emails.html(subject=subject, html='<div>test</div>', mail_from=account['username'] + '@' + account['domain'])
                r = message.send(to=to,
                                 smtp={'host': account['smtp'],
                                       'port': account['port'],
                                       'ssl': True,
                                       'user': account['username'],
                                       'password': account['password']})
                self.finish(str(r))
                return
        raise Exception('Email not found!')


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
            k['password'] = getpass('Input password for %s@%s:' % (k['username'], k['name']))
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/get'), EmailsListHandler, {'emails': emails})])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/run'), EmailHandler, {'emails': emails})])
