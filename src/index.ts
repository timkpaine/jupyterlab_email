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

    let default_none = document.createElement('option');
    default_none.selected = false;
    default_none.disabled = true;
    default_none.hidden = false;
    default_none.style.display = 'none';
    default_none.value = '';

    let type = document.createElement('select');
    for(let x of ['Email', 'HTML Attachment', 'PDF Attachment']){
      let option = document.createElement('option');
      option.value = x
      option.textContent = x;
      type.appendChild(option);

      if (x === 'Email'){
        option.selected = true;
      }
    }
    type.style.marginBottom = '15px';
    type.style.minHeight = '25px';
    body.appendChild(type);

    let code = document.createElement('select');
    code.appendChild(default_none);
    for(let x of ['Code', 'No code']){
      let option = document.createElement('option');
      option.value = x
      option.textContent = x;
      code.appendChild(option);

      if (hide_code && x === 'No code'){
        option.selected = true;
      }
    }
    code.style.marginBottom = '15px';
    code.style.minHeight = '25px';
    body.appendChild(code);

    if(accounts.length > 0){
      let account = document.createElement('select');
      account.appendChild(default_none);
      for(let x of accounts){
        let option = document.createElement('option');
        option.value = x
        option.textContent = x;
        account.appendChild(option);
        if(x === account_name){
          option.selected = true;
        }
      }
      account.style.marginBottom = '15px';
      account.style.minHeight = '25px';
      body.appendChild(account);
    }

    let to = document.createElement('textarea');
    to.placeholder = 'list,of,emails, default is to self';
    to.style.marginBottom = '15px';
    body.appendChild(to);

    let subject = document.createElement('textarea');
    subject.placeholder = 'Subject of email';
    body.appendChild(subject);

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
  let all_emails2: string[] = [];
  let all_accounts: string[] = [];
  let all_templates: string[] = [];

  let loaded = false;

  // grab templates from serverextension
  var xhr = new XMLHttpRequest();
  xhr.open("GET", PageConfig.getBaseUrl() + "email/get", true);
  xhr.onload = function (e:any) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (loaded){
          return;
        }
        loaded = true;

        let info = JSON.parse(xhr.responseText);

        for (let template of info['templates']){
          all_templates.push(template);
        }

        for (let email of info['emails']){

        let command1 = 'send-email:' + email;
        let command2 = 'send-email-nocode:' + email;
        all_accounts.push(email);
        all_emails1.push(command1);
        all_emails2.push(command2);

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
                                           'to': to
                                         }));
                });
              });
            }
          });

          app.commands.addCommand(command2, {
          label: command2,
          isEnabled: () => {
            if (app.shell.currentWidget && docManager.contextForWidget(app.shell.currentWidget) && docManager.contextForWidget(app.shell.currentWidget).model){
              return true;
            } 
            return false;
          },
          execute: () => {
            showDialog({
                title: 'Send email:',
                body: new SendEmailWidget(all_accounts, true, email),
                // focusNodeSelector: 'input',
                buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Ok' })]
              }).then(result => {
                if (result.button.label === 'CANCEL') {
                  return;
                }
              });
            }
          });

          palette.addItem({command: command1, category: 'Email'});
          palette.addItem({command: command2, category: 'Email'});

          const menu = new Menu({ commands });
          menu.title.label = 'Send Emails';

          const menu1 = new Menu({ commands });
          menu1.title.label = 'With Code';

          let menu2 = new Menu({ commands });
          menu2.title.label = 'No Code';

          console.log(all_emails1);
          console.log(all_emails2);

          app.restored.then(() => {
            all_emails1.forEach(command => {
              menu1.addItem({command, args: {}})
            });
            all_emails2.forEach(command => {
              menu2.addItem({command, args: {}})
            });

            menu.addItem({type: 'submenu', submenu: menu1});
            menu.addItem({type: 'submenu', submenu: menu2});

            if (mainMenu) {
              console.log('adding submenu');
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
