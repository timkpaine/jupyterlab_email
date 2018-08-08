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

import '../style/index.css';

const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_email',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, IFileBrowserFactory],
  optional: [ILauncher],
  activate: activate
};


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

  // grab templates from serverextension
  var xhr = new XMLHttpRequest();
  xhr.open("GET", PageConfig.getBaseUrl() + "email/get", true);
  xhr.onload = function (e:any) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        let emails = JSON.parse(xhr.responseText);
        for (let email of emails){

        let command1 = 'email:' + email['name'];
        let command2 = 'nocode:' + email['name'];
        all_emails1.push(command1);
        all_emails2.push(command2);

        app.commands.addCommand(command1, {
          label: command1,
          isEnabled: () => true,
          execute: () => {
            showDialog({
                title: 'Send email:',
                body: '',
                // focusNodeSelector: 'input',
                buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Ok' })]
              }).then(result => {
                if (result.button.label === 'CANCEL') {
                  return;
                }
                // let folder = browser.defaultBrowser.model.path || '';
                // const widget = app.shell.currentWidget;
                // const context = docManager.contextForWidget(app.shell.currentWidget);

                // let path = '';
                // let model = {};
                // if(context){
                //   path = context.path; 
                //   model = context.model.toJSON();
                // }

                // console.log(widget);
                // console.log(context);

                // return new Promise(function(resolve) {
                //   var xhr = new XMLHttpRequest();
                //   xhr.open("POST", PageConfig.getBaseUrl() + "commands/run?command=" + encodeURI(command), true);
                //   xhr.onload = function (e:any) {
                //     if (xhr.readyState === 4) {
                //       if (xhr.status === 200) {
                //         showDialog({
                //             title: 'Execute ' + command + ' succeeded',
                //             // body: '',
                //             // focusNodeSelector: 'input',
                //             buttons: [Dialog.okButton({ label: 'Ok' })]
                //           }).then(() => {resolve();})
                //       } else {
                //         showDialog({
                //             title: 'Execute ' + command + ' failed',
                //             // body: '',
                //             // focusNodeSelector: 'input',
                //             buttons: [Dialog.okButton({ label: 'Ok' })]
                //           }).then(() => {resolve();})
                //       }
                //     }
                //   };
                //   xhr.send(JSON.stringify({'folder': folder, 'path': path, 'model': model}));
                // });
              });
            }
          });
          app.commands.addCommand(command2, {
          label: command2,
          isEnabled: () => true,
          execute: () => {
            showDialog({
                title: 'Send email:',
                body: '',
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
          });

          if (mainMenu) {
            mainMenu.fileMenu.addGroup([{ type:'submenu', submenu: menu }], 11);
          }

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
