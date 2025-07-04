// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="hardware/hardware.html"><strong aria-hidden="true">1.</strong> Hardware Requirements</a></li><li class="chapter-item expanded "><a href="build/build.html"><strong aria-hidden="true">2.</strong> Build</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="build/4090.html"><strong aria-hidden="true">2.1.</strong> 4090</a></li><li class="chapter-item expanded "><a href="build/h100.html"><strong aria-hidden="true">2.2.</strong> h100</a></li><li class="chapter-item expanded "><a href="build/telemetry.html"><strong aria-hidden="true">2.3.</strong> telemetry</a></li></ol></li><li class="chapter-item expanded "><a href="architecture/arch.html"><strong aria-hidden="true">3.</strong> Architecture</a></li><li class="chapter-item expanded "><a href="structure/stru.html"><strong aria-hidden="true">4.</strong> Structure</a></li><li class="chapter-item expanded "><a href="glo_variables/var.html"><strong aria-hidden="true">5.</strong> Glo Variables</a></li><li class="chapter-item expanded "><a href="components/component.html"><strong aria-hidden="true">6.</strong> Components</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="components/router.html"><strong aria-hidden="true">6.1.</strong> Router</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="components/router/disaggregation.html"><strong aria-hidden="true">6.1.1.</strong> Disaggregation(TODO)</a></li><li class="chapter-item expanded "><a href="components/router/exec_blitz.html"><strong aria-hidden="true">6.1.2.</strong> Exec_Blitz</a></li><li class="chapter-item expanded "><a href="components/router/infer.html"><strong aria-hidden="true">6.1.3.</strong> Infer</a></li><li class="chapter-item expanded "><a href="components/router/migration_queue.html"><strong aria-hidden="true">6.1.4.</strong> Migration_queue</a></li><li class="chapter-item expanded "><a href="components/router/planner.html"><strong aria-hidden="true">6.1.5.</strong> Planner</a></li><li class="chapter-item expanded "><a href="components/router/colocation.html"><strong aria-hidden="true">6.1.6.</strong> Colocation(TODO)</a></li></ol></li><li class="chapter-item expanded "><a href="components/client.html"><strong aria-hidden="true">6.2.</strong> Client</a></li><li class="chapter-item expanded "><a href="components/server.html"><strong aria-hidden="true">6.3.</strong> Server</a></li></ol></li><li class="chapter-item expanded "><a href="scripts/script.html"><strong aria-hidden="true">7.</strong> Scripts</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="scripts/args.html"><strong aria-hidden="true">7.1.</strong> Args</a></li><li class="chapter-item expanded "><a href="scripts/usage.html"><strong aria-hidden="true">7.2.</strong> Usage</a></li></ol></li><li class="chapter-item expanded "><li class="spacer"></li><li class="chapter-item expanded affix "><li class="part-title">Example</li><li class="chapter-item expanded "><a href="example/example1.html"><strong aria-hidden="true">8.</strong> Example1</a></li><li class="chapter-item expanded affix "><li class="part-title">Q&amp;A</li><li class="chapter-item expanded "><a href="questions/question.html"><strong aria-hidden="true">9.</strong> Questions</a></li><li class="chapter-item expanded affix "><li class="spacer"></li><li class="chapter-item expanded affix "><a href="acknowledgement/ack.html">Acknowledgement</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
