'use babel';

class EditorUitlities
{
    static getEditor (editorId)
    {
        const editors = atom.workspace.getTextEditors();
        for (const i in editors)
        {
            const editor = editors[i];
            if (editor.id.toString() === editorId.toString()) return editor;
        }
    }
}

export default EditorUitlities;
