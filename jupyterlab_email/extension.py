import os
import os.path
from getpass import getpass
from notebook.utils import url_path_join
from .handlers import EmailHandler, EmailsListHandler


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
        elif 'function' in k:
            print('Skipping password input for %s@%s' % (k['username'], k['name']))
        else:
            k['password'] = getpass('Input password for %s@%s:' % (k['username'], k['name']))

    context = {}
    context['emails'] = emails
    context['templates'] = {}
    context['templates']['email'] = os.path.join(os.path.dirname(__file__), 'templates', 'html_email.tpl')
    context['templates']['email_nocode'] = os.path.join(os.path.dirname(__file__), 'templates', 'hide_code_cells_html_email.tpl')
    context['templates']['html_nocode'] = os.path.join(os.path.dirname(__file__), 'templates', 'hide_code_cells_html.tpl')
    context['templates']['pdf_nocode'] = os.path.join(os.path.dirname(__file__), 'templates', 'hide_code_cells_pdf.tplx')

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/get'), EmailsListHandler, context)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/run'), EmailHandler, context)])
