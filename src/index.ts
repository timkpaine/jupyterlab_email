import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ICommandPalette, showDialog, Dialog
} from '@jupyterlab/apputils';

import {
  PageConfig
} from '@jupyterlab/coreutils'

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import {
  Menu
} from '@phosphor/widgets';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import {
  ILauncher
} from '@jupyterlab/launcher';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

import {
  Widget
} from '@phosphor/widgets';


import '../style/index.css';

const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_email',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, IFileBrowserFactory],
  optional: [ILauncher],
  activate: activate
};



class SendEmailWidget extends Widget {
  constructor(accounts: string[] = [], hide_code:boolean = false, account_name:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.classList.add('jupyterlab_email_form');

    let basic = document.createElement('div');
    basic.style.flex = '1';
    body.appendChild(basic);

    basic.appendChild(Private.buildLabel('Type:'));
    basic.appendChild(Private.buildSelect(['Email', 'HTML Attachment', 'PDF Attachment'], 'Email'));
    basic.appendChild(Private.buildLabel('Code or no Code:'));
    basic.appendChild(Private.buildSelect(['Code', 'No code'], 'No code'));
    basic.appendChild(Private.buildLabel('Send email to:'));
    basic.appendChild(Private.buildTextarea('list, of, emails, default is to self'));
    basic.appendChild(Private.buildLabel('Email Subject:'));
    basic.appendChild(Private.buildTextarea('Subject of email'));

    /* Advanced options */
    let advanced = document.createElement('div');
    advanced.style.flex = '1';

    let advanced_label = document.createElement('label');
    advanced_label.textContent = 'Advanced';

    let advanced_button_open = document.createElement('button');
    let advanced_span_open = document.createElement('span');
    let advanced_button_close = document.createElement('button');
    let advanced_span_close = document.createElement('span');

    advanced_button_open.classList.add('jp-ToolbarButtonComponent');
    advanced_button_close.classList.add('jp-ToolbarButtonComponent');

    advanced_button_open.appendChild(advanced_span_open);
    advanced_button_close.appendChild(advanced_span_close);
    advanced_span_open.classList.add('jupyterlab_email_open');
    advanced_span_open.classList.add('jp-Icon');
    advanced_span_open.classList.add('jp-Icon-16');
    
    advanced_span_close.classList.add('jupyterlab_email_close');
    advanced_span_close.classList.add('jp-Icon');
    advanced_span_close.classList.add('jp-Icon-16');

    body.appendChild(advanced_label);
    body.appendChild(advanced_button_open);
    body.appendChild(advanced_button_close);
    body.appendChild(advanced);

    advanced.style.display = 'none';
    advanced_button_open.style.display = 'block';
    advanced_button_close.style.display = 'none';

    advanced_button_open.onclick = () =>{
        advanced.style.display = 'block';
        advanced_button_open.style.display = 'none';
        advanced_button_close.style.display = 'block';
    }

    advanced_button_close.onclick = () =>{
        advanced.style.display = 'none';
        advanced_button_open.style.display = 'block';
        advanced_button_close.style.display = 'none';
    }

    if (accounts.length>0) {
      advanced.appendChild(Private.buildLabel('Account:'));
      advanced.appendChild(Private.buildSelect(accounts, account_name))
    }

    advanced.appendChild(Private.buildLabel('Also attach as:'));
    advanced.appendChild(Private.buildSelect(['None', 'PDF', 'HTML', 'Both'], 'None'));
    advanced.appendChild(Private.buildLabel('Template:'));
    advanced.appendChild(Private.buildSelect(['Test']));

    super({ node: body });
  }

  public getCode(): string {
    return this.codeNode.value;
  }

  public getEmail(): string {
    return this.emailNode.value;
  }

  public getType(): string {
    return this.typeNode.value;
  }

  public getTo(): string {
    return this.toNode.value;
  }

  public getSubject(): string {
    return this.subjectNode.value;
  }

  public getAlsoAttach(): string {
    return this.alsoAttachNode.value;
  }

  get typeNode(): HTMLSelectElement {
    return this.node.getElementsByTagName('select')[0] as HTMLSelectElement;
  }

  get codeNode(): HTMLSelectElement {
    return this.node.getElementsByTagName('select')[1] as HTMLSelectElement;
  }

  get emailNode(): HTMLSelectElement {
    return this.node.getElementsByTagName('select')[2] as HTMLSelectElement;
  }
  get toNode(): HTMLTextAreaElement {
    return this.node.getElementsByTagName('textarea')[0] as HTMLTextAreaElement;
  }
  get subjectNode(): HTMLTextAreaElement {
    return this.node.getElementsByTagName('textarea')[1] as HTMLTextAreaElement;
  }
  get alsoAttachNode(): HTMLSelectElement {
    return this.node.getElementsByTagName('select')[3] as HTMLSelectElement;
  }
}

function activate(app: JupyterLab,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  browser: IFileBrowserFactory,
                  launcher: ILauncher | null) {

  let commands = app.commands;
  let all_emails1: string[] = [];
  let all_accounts: string[] = [];
  let all_templates: string[] = [];
  let loaded = false;

  // grab templates from serverextension
  var xhr = new XMLHttpRequest();
  xhr.open("GET", PageConfig.getBaseUrl() + "email/get", true);

  xhr.onload = function (e:any) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        let info = JSON.parse(xhr.responseText);

        for (let template of info['templates']){
          all_templates.push(template);
        }

        for (let email of info['emails']){

        let command1 = 'send-email:' + email;

        all_accounts.push(email);
        all_emails1.push(command1);

        let send_widget = new SendEmailWidget(all_accounts,false, email);
        app.commands.addCommand(command1, {
          label: command1,
          isEnabled: () => {
            if (app.shell.currentWidget && docManager.contextForWidget(app.shell.currentWidget) && docManager.contextForWidget(app.shell.currentWidget).model){
              return true;
            } 
            return false;
          },
          execute: () => {
            showDialog({
                title: 'Send email:',
                body: send_widget,
                // focusNodeSelector: 'input',
                buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Ok' })]
              }).then(result => {
                if (result.button.label === 'CANCEL') {
                  return;
                }

                let folder = browser.defaultBrowser.model.path || '';
                const context = docManager.contextForWidget(app.shell.currentWidget);

                let type = send_widget.getType();
                let email = send_widget.getEmail();
                let code = send_widget.getCode();
                let to = send_widget.getTo();
                let subject = send_widget.getSubject();
                let also_attach = send_widget.getAlsoAttach();

                let path = '';
                let model = {};
                if(context){
                  path = context.path; 
                  model = context.model.toJSON();
                }

                return new Promise(function(resolve) {
                  var xhr = new XMLHttpRequest();
                  xhr.open("POST", PageConfig.getBaseUrl() + "email/run", true);
                  xhr.onload = function (e:any) {
                    if (xhr.readyState === 4) {
                      if (xhr.status === 200) {
                        showDialog({
                            title: 'Mail sent!',
                            buttons: [Dialog.okButton({ label: 'Ok' })]
                          }).then(() => {resolve();})
                      } else {
                        showDialog({
                            title: 'Something went wrong!',
                            body: 'Check the Jupyter logs for the exception.',
                            buttons: [Dialog.okButton({ label: 'Ok' })]
                          }).then(() => {resolve();})
                      }
                    }
                  };
                  xhr.send(JSON.stringify({'folder': folder,
                                           'path': path,
                                           'model': model,
                                           'type': type,
                                           'email': email,
                                           'code': code,
                                           'subject': subject,
                                           'to': to,
                                           'also_attach': also_attach
                                         }));
                });
              });
            }
          });

          palette.addItem({command: command1, category: 'Email'});

          const menu = new Menu({ commands });
          menu.title.label = 'Send Emails';

          app.restored.then(() => {
            all_emails1.forEach(command => {
              menu.addItem({command, args: {}})
            });

            if (mainMenu && !loaded) {
              console.log('adding submenu');
              loaded = true;
              mainMenu.fileMenu.addGroup([{ type:'submenu', submenu: menu }], 11);
            }
          });
        }

      } else {
        console.error(xhr.statusText);
      }
    }
  }.bind(this);
  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);

  console.log('JupyterLab extension jupyterlab_email is activated!');
};

export default extension;


namespace Private {
    let default_none = document.createElement('option');
    default_none.selected = false;
    default_none.disabled = true;
    default_none.hidden = false;
    default_none.style.display = 'none';
    default_none.value = '';

  export 
  function buildLabel(text: string): HTMLLabelElement {
    let label = document.createElement('label');
    label.textContent = text;
    return label;
  }

 export 
  function buildTextarea(text: string): HTMLTextAreaElement {
    let area = document.createElement('textarea');
    area.placeholder = text;
    area.style.marginBottom = '15px';
    return area;
  }


  export
  function buildSelect(list: string[], def?: string): HTMLSelectElement {
    let select = document.createElement('select');
    select.appendChild(default_none);
    for(let x of list) {
      let option = document.createElement('option');
      option.value = x
      option.textContent = x;
      select.appendChild(option);

      if (def && x === def){
        option.selected = true;
      }
    }
    select.style.marginBottom = '15px';
    select.style.minHeight = '25px';
    return select;
  }
}