import os
import os.path
import logging
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

    # should be a list of template paths
    user_templates = nb_server_app.config.get('JupyterLabEmail', {}).get('templates', {})

    headers = nb_server_app.config.get('JupyterLabEmail', {}).get('headers', {})
    footers = nb_server_app.config.get('JupyterLabEmail', {}).get('footers', {})
    signatures = nb_server_app.config.get('JupyterLabEmail', {}).get('signatures', {})
    postprocessors = nb_server_app.config.get('JupyterLabEmail', {}).get('postprocessors', {})

    base_url = web_app.settings['base_url']

    host_pattern = '.*$'
    logging.critical('Installing jupyterlab_email handler on path %s' % url_path_join(base_url, 'emails'))
    logging.critical('Available email servers: %s' % ','.join(k['name'] for k in emails))

    for k in emails:
        if 'password' in k:
            logging.critical('WARNING!!! You should not store your password in jupyter_notebook_config.py!!!')
        elif 'function' in k:
            logging.critical('Skipping password input for %s@%s' % (k['username'], k['name']))
        else:
            k['password'] = getpass('Input password for %s@%s:' % (k['username'], k['name']))

    context = {}
    context['emails'] = emails
    context['headers'] = headers
    context['footers'] = footers
    context['signatures'] = signatures
    context['postprocessors'] = postprocessors
    context['user_templates'] = user_templates
    context['templates'] = {}
    context['templates']['email'] = os.path.join(os.path.dirname(__file__), 'templates', 'html_email.tpl')
    context['templates']['email_nocode'] = os.path.join(os.path.dirname(__file__), 'templates', 'hide_code_cells_html_email.tpl')
    context['templates']['html'] = os.path.join(os.path.dirname(__file__), 'templates', 'html.tpl')
    context['templates']['html_nocode'] = os.path.join(os.path.dirname(__file__), 'templates', 'hide_code_cells_html.tpl')
    context['templates']['pdf'] = os.path.join(os.path.dirname(__file__), 'templates', 'pdf.tplx')
    context['templates']['pdf_nocode'] = os.path.join(os.path.dirname(__file__), 'templates', 'hide_code_cells_pdf.tplx')

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/get'), EmailsListHandler, context)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'email/run'), EmailHandler, context)])
