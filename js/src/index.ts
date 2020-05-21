import {
  ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin,
} from "@jupyterlab/application";

import {
  Dialog, ICommandPalette, showDialog,
} from "@jupyterlab/apputils";

import {
  PageConfig,
} from "@jupyterlab/coreutils";

import {
  IDocumentManager,
} from "@jupyterlab/docmanager";

import {
  Menu,
} from "@lumino/widgets";

import {
  IFileBrowserFactory,
} from "@jupyterlab/filebrowser";

import {
  ILauncher,
} from "@jupyterlab/launcher";

import {
  IMainMenu,
} from "@jupyterlab/mainmenu";

import {
  Widget,
} from "@lumino/widgets";

import {
  IRequestResult, request,
} from "requests-helper";

import "../style/index.css";

// tslint:disable: variable-name

const extension: JupyterFrontEndPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyterlab_email",
  optional: [ILauncher],
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, IFileBrowserFactory],
};

export
class SendEmailWidget extends Widget {
  public constructor(accounts: string[] = [],
                     hide_code = false,
                     account_name = "",
                     templates: string[] = [],
                     signatures: string[] = [],
                     headers: string[] = [],
                     footers: string[] = [],
                     user_templates: string[] = [],
                     postprocessors: string[] = [],

  ) {
    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.classList.add("jupyterlab_email_form");

    const basic = document.createElement("div");
    basic.style.flex = "1";
    body.appendChild(basic);

    basic.appendChild(Private.buildLabel("Type:"));
    basic.appendChild(Private.buildSelect(["Email", "HTML Attachment", "PDF Attachment"], "type", "Email"));
    basic.appendChild(Private.buildLabel("Code or no Code:"));
    basic.appendChild(Private.buildSelect(["Code", "No code"], "code", "No code"));
    basic.appendChild(Private.buildLabel("Send email to:"));
    basic.appendChild(Private.buildTextarea("list, of, emails, default is to self"));
    basic.appendChild(Private.buildLabel("Email Subject:"));
    basic.appendChild(Private.buildTextarea("Subject of email"));

    /* Advanced options */
    const advanced = document.createElement("div");
    advanced.style.flex = "1";

    const expand_div = document.createElement("div");
    expand_div.style.display = "flex";
    expand_div.style.flexDirection = "row";

    const advanced_label = document.createElement("label");
    advanced_label.textContent = "Advanced";

    expand_div.appendChild(advanced_label);

    const advanced_button_open = document.createElement("button");
    const advanced_span_open = document.createElement("span");
    const advanced_button_close = document.createElement("button");
    const advanced_span_close = document.createElement("span");

    advanced_button_open.classList.add("jp-ToolbarButtonComponent");
    advanced_button_close.classList.add("jp-ToolbarButtonComponent");

    advanced_button_open.appendChild(advanced_span_open);
    advanced_button_close.appendChild(advanced_span_close);
    advanced_span_open.classList.add("jupyterlab_email_open");

    advanced_span_close.classList.add("jupyterlab_email_close");

    expand_div.appendChild(advanced_button_open);
    expand_div.appendChild(advanced_button_close);

    body.appendChild(expand_div);
    body.appendChild(advanced);

    advanced.style.display = "none";
    advanced_button_open.style.display = "block";
    advanced_button_close.style.display = "none";

    advanced_button_open.onclick = () => {
      advanced.style.display = "block";
      advanced_button_open.style.display = "none";
      advanced_button_close.style.display = "block";
    };

    advanced_button_close.onclick = () => {
      advanced.style.display = "none";
      advanced_button_open.style.display = "block";
      advanced_button_close.style.display = "none";
    };

    if (accounts.length > 0) {
      advanced.appendChild(Private.buildLabel("Account:"));
      advanced.appendChild(Private.buildSelect(accounts, "accounts", account_name));
    }

    advanced.appendChild(Private.buildLabel("Also attach as:"));
    advanced.appendChild(Private.buildSelect(["None", "PDF", "HTML", "Both"], "attach", "None"));

    if (templates.length > 0) {
      advanced.appendChild(Private.buildLabel("Template:"));
      advanced.appendChild(Private.buildSelect(templates, "templates"));
    }

    if (user_templates.length > 0) {
      advanced.appendChild(Private.buildLabel("User Templates (Overrides 'builtin' template choice):"));
      advanced.appendChild(Private.buildSelect(user_templates, "user_template"));
    }

    if (signatures.length > 0) {
      advanced.appendChild(Private.buildLabel("Signature:"));
      advanced.appendChild(Private.buildSelect(signatures, "signatures"));
    }

    if (headers.length > 0) {
      advanced.appendChild(Private.buildLabel("Header:"));
      advanced.appendChild(Private.buildSelect(headers, "headers"));
    }

    if (footers.length > 0) {
      advanced.appendChild(Private.buildLabel("Footer:"));
      advanced.appendChild(Private.buildSelect(footers, "footers"));
    }

    if (postprocessors.length > 0) {
      advanced.appendChild(Private.buildLabel("Post Processors:"));
      advanced.appendChild(Private.buildSelect(postprocessors, "postprocessor"));
    }

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

  public getTemplate(): string {
    return this.templateNode ? this.templateNode.value : "";
  }

  public getSignature(): string {
    return this.signatureNode ? this.signatureNode.value : "";
  }

  public getHeader(): string {
    return this.headerNode ? this.headerNode.value : "";
  }

  public getFooter(): string {
    return this.footerNode ? this.footerNode.value : "";
  }

  public getUserTemplate(): string {
    return this.userTemplateNode ? this.userTemplateNode.value : "";
  }

  public getPostprocessor(): string {
    return this.userTemplateNode ? this.userTemplateNode.value : "";
  }

  public get typeNode(): HTMLSelectElement {
    return this.node.getElementsByTagName("select")[0];
  }

  public get codeNode(): HTMLSelectElement {
    return this.node.getElementsByTagName("select")[1];
  }

  public get emailNode(): HTMLSelectElement {
    return this.node.getElementsByTagName("select")[2];
  }

  public get toNode(): HTMLTextAreaElement {
    return this.node.getElementsByTagName("textarea")[0];
  }

  public get subjectNode(): HTMLTextAreaElement {
    return this.node.getElementsByTagName("textarea")[1];
  }

  public get alsoAttachNode(): HTMLSelectElement {
    return this.node.getElementsByTagName("select")[3];
  }

  public get templateNode(): HTMLSelectElement {
    return this.node.querySelector("select.templates");
  }

  public get signatureNode(): HTMLSelectElement {
    return this.node.querySelector("select.signatures");
  }

  public get headerNode(): HTMLSelectElement {
    return this.node.querySelector("select.headers");
  }

  public get footerNode(): HTMLSelectElement {
    return this.node.querySelector("select.footers");
  }

  public get userTemplateNode(): HTMLSelectElement {
    return this.node.querySelector("select.user_template");
  }

  public get postprocessorNode(): HTMLSelectElement {
    return this.node.querySelector("select.postprocessor");
  }
}

function activate(app: JupyterFrontEnd,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  browser: IFileBrowserFactory,
                  launcher: ILauncher | null) {

  const commands = app.commands;
  const all_emails1: string[] = [];
  const all_accounts: string[] = [];
  const all_templates: string[] = [];
  const all_user_templates: string[] = [];
  const all_signatures: string[] = [];
  const all_headers: string[] = [];
  const all_footers: string[] = [];
  let loaded = false;

  // grab templates from serverextension
  request("get", PageConfig.getBaseUrl() + "email/get").then((res: IRequestResult) => {
    if (res.ok) {
      const info: any = res.json();

      for (const template of info.templates) {
        all_templates.push(template);
      }

      for (const template of info.user_templates) {
        all_user_templates.push(template);
      }

      for (const signature of info.signatures) {
        all_signatures.push(signature);
      }

      for (const header of info.headers) {
        all_headers.push(header);
      }

      for (const footer of info.footers) {
        all_footers.push(footer);
      }

      for (const email of info.emails) {

        const command1 = "send-email:" + email;

        all_accounts.push(email);
        all_emails1.push(command1);

        const send_widget = new SendEmailWidget(all_accounts,
          false,
          email,
          all_templates,
          all_signatures,
          all_headers,
          all_footers,
          all_user_templates);
        app.commands.addCommand(command1, {
          execute: () => {
            showDialog({
              body: send_widget,
              buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "Ok" })],
              title: "Send email:",
            }).then((result) => {
              if (result.button.label === "Cancel") {
                return;
              }

              const folder = browser.defaultBrowser.model.path || "";
              const context = docManager.contextForWidget(app.shell.currentWidget);

              const type = send_widget.getType();
              // eslint-disable-next-line no-shadow
              const email = send_widget.getEmail();
              const code = send_widget.getCode();
              const to = send_widget.getTo();
              const subject = send_widget.getSubject();
              const also_attach = send_widget.getAlsoAttach();
              const template = send_widget.getTemplate();
              const user_template = send_widget.getUserTemplate();
              const signature = send_widget.getSignature();
              const header = send_widget.getHeader();
              const footer = send_widget.getFooter();
              const postprocessor = send_widget.getPostprocessor();

              let path = "";
              let model = {};
              if (context) {
                path = context.path;
                model = context.model.toJSON();
              }

              return new Promise((resolve) => {
                request("post",
                  PageConfig.getBaseUrl() + "email/run",
                  {},
                  {also_attach,
                    code,
                    email,
                    folder,
                    footer,
                    header,
                    model,
                    path,
                    postprocessor,
                    signature,
                    subject,
                    template,
                    to,
                    type,
                    user_template,
                  },
                  {timeout: 30000}).then(
                  // eslint-disable-next-line no-shadow
                  (res: IRequestResult) => {
                    if (res.ok) {
                      showDialog({
                        buttons: [Dialog.okButton({ label: "Ok" })],
                        title: "Mail sent!",
                      }).then(() => {
                        resolve();
                      });
                    } else {
                      showDialog({
                        body: "Check the Jupyter logs for the exception.",
                        buttons: [Dialog.okButton({ label: "Ok" })],
                        title: "Something went wrong!",
                      }).then(() => {
                        resolve();
                      });
                    }
                  });
              });
            });
          },
          isEnabled: () => {
            if (app.shell.currentWidget &&
              docManager.contextForWidget(app.shell.currentWidget) &&
              docManager.contextForWidget(app.shell.currentWidget).model) {
              return true;
            }
            return false;
          },
          label: command1,
        });

        palette.addItem({command: command1, category: "Email"});

        const menu = new Menu({ commands });
        menu.title.label = "Send Emails";

        app.restored.then(() => {
          all_emails1.forEach((command) => {
            menu.addItem({command, args: {}});
          });

          if (mainMenu && !loaded) {
            loaded = true;
            mainMenu.fileMenu.addGroup([{ type: "submenu", submenu: menu }], 11);
          }
        });
      }
    }
  });
  // eslint-disable-next-line no-console
  console.log("JupyterLab extension jupyterlab_email is activated!");
}

export default extension;
export {activate as _activate};

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Private {
  const default_none = document.createElement("option");
  default_none.selected = false;
  default_none.disabled = true;
  default_none.hidden = false;
  default_none.style.display = "none";
  default_none.value = "";

  export
  function buildLabel(text: string): HTMLLabelElement {
    const label = document.createElement("label");
    label.textContent = text;
    return label;
  }

  export
  function buildTextarea(text: string): HTMLTextAreaElement {
    const area = document.createElement("textarea");
    area.placeholder = text;
    area.style.marginBottom = "15px";
    return area;
  }

  export
  function buildSelect(list: string[], _class = "", def?: string): HTMLSelectElement {
    const select = document.createElement("select");
    select.classList.add(_class);
    select.appendChild(default_none);
    for (const x of list) {
      const option = document.createElement("option");
      option.value = x;
      option.textContent = x;
      select.appendChild(option);

      if (def && x === def) {
        option.selected = true;
      }
    }
    select.style.marginBottom = "15px";
    select.style.minHeight = "25px";
    return select;
  }
}
