# Create and activate a virtual environment

We are going to import Python packages to make accessing the API easier. This will keep those project packages isolated to this project. You’ll know it worked if you see `(.venv)` at the start of your terminal prompt.

{% tabs %}
{% tab title="Windows (PowerShell)" %}
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```
{% endtab %}

{% tab title="macOS/Linux" %}
<pre class="language-bash"><code class="lang-bash"><strong>python3 -m venv .venv
</strong>source .venv/bin/activate
</code></pre>
{% endtab %}
{% endtabs %}

{% hint style="warning" %}
Something not working as expected? Check out [common issues & solutions](../common-issues-and-solutions.md).&#x20;
{% endhint %}
