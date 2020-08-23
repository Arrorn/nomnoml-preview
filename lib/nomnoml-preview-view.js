'use babel';

import EditorUitlities from './editorUtilities';

import { CompositeDisposable } from 'atom';
import { View } from 'atom-space-pen-views';
import nomnoml from 'nomnoml';

import 'svg-pan-zoom';
/* global svgPanZoom */

class NomnomlPreviewView extends View
{
    static content ()
    {
        this.div({ outlet: 'container', id: 'nomnomlPreviewContainer' }, () =>
        {
            this.div({ outlet: 'canvas', id: 'nomnomlPreviewCanvas' });
        });
    }

    constructor (uri, editorId)
    {
        super();
        console.log('Pane created');
        this.open = false;

        this.uri = uri;
        this.editorId = editorId;

        this.showControls = Boolean(atom.config.get('nomnoml-preview.showControls'));
        this.startCentered = Boolean(atom.config.get('nomnoml-preview.startCentered'));
        this.startFitedToPane = Boolean(atom.config.get('nomnoml-preview.startFitedToPane'));

        this.subscriptions = new CompositeDisposable();

        this.subscriptions.add(atom.config.observe('nomnoml-preview.showControls', (newValue) =>
        {
            this.showControls = Boolean(newValue);
            this.updateCanvas();
        }));

        this.subscriptions.add(atom.config.observe('nomnoml-preview.startCentered', (newValue) =>
        {
            this.startCentered = Boolean(newValue);
            this.updateCanvas();
        }));

        this.subscriptions.add(atom.config.observe('nomnoml-preview.startFitedToPane', (newValue) =>
        {
            this.startFitedToPane = Boolean(newValue);
            this.updateCanvas();
        }));

        this.resolve = () =>
        {
            if (!this.editor)
            {
                this.editor = EditorUitlities.getEditor(editorId);
            }
        };

        if (atom.workspace) this.resolve();
        else this.subscriptions.add(atom.packages.onDidActivateInitialPackages(this.resolve));

        this.updateCanvas();

        this.subscriptions.add(
            this.editor.getBuffer().onDidChange(
                () =>
                {
                    this.updateCanvas();
                }
            )
        );

        // atom.workspace.element.getElementById()
    }

    serialize ()
    {
        return {
            deserializer: 'NomnomlPreviewView',
            editorId: this.editorId
        };
    }

    destroy ()
    {
        this.subscriptions.dispose();
    }

    getTitle ()
    {
        let title = 'Nomnoml';
        if (this.editor)
        {
            title = this.editor.getTitle();
        }
        return title + ' Preview';
    }

    getURI ()
    {
        return this.uri;
    }

    getPath ()
    {
        return this.editor.getPath();
    }

    isEqual (other)
    {
        return other instanceof NomnomlPreviewView &&
        this.getURI() === other.getURI();
    }

    updateCanvas ()
    {
        if (typeof this.spz !== 'undefined')
        {
            this.pan = this.spz.getPan();
            this.zoom = this.spz.getZoom();
        }
        try
        {
            var svg = nomnoml.renderSvg(this.editor.getText());
        }
        catch (e)
        {
            // svg = e;
            svg = document.createElement('div');
            svg.appendChild(document.createTextNode(e.message));
        }
        this.canvas.html(svg);
        this.updatePanZoom();
    }

    updatePanZoom ()
    {
        if (this.canvas.children('svg').length > 0 && this.open)
        {
            this.svg = this.canvas.children('svg').first().get(0);
            this.spz = svgPanZoom(this.svg);
            this.svg.setAttribute('height', '100%');
            this.svg.setAttribute('width', '100%');
            this.spz.updateBBox();
            this.spz.resize();
            if (this.showControls)
            {
                this.spz.enableControlIcons();
            }
            else
            {
                this.spz.disableControlIcons();
            }
            if (typeof this.zoom !== 'undefined')
            {
                this.spz.zoom(this.zoom);
            }
            if (typeof this.pan !== 'undefined')
            {
                this.spz.pan(this.pan);
            }
        }
    }

    opened ()
    {
        this.open = true;
        this.updatePanZoom();
        if (typeof this.spz !== 'undefined')
        {
            if (this.startCentered)
            {
                this.spz.center();
            }
            if (this.startFitedToPane)
            {
                this.spz.fit();
            }
        }
    }
}

export default NomnomlPreviewView;
