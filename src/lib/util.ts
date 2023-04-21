export function clickOutside(node: any) {

    const handleClick = (event: any) => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
                new CustomEvent('click_outside', node)
            )
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    }
}

export function tooltip(element: HTMLElement) {
    let div: HTMLDivElement;
    let title: string;

    function mouseOver(event: MouseEvent) {
        // NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
        // remember to set it back on `mouseleave`
        title = element.getAttribute('title') ?? "";
        element.removeAttribute('title');

        div = document.createElement('div');
        div.textContent = title;
        div.style.left = `${event.pageX + 5}px`;
        div.style.zIndex = "1000";
        div.style.top = `${event.pageY - 5}px`;
        div.style.position = "fixed";
        div.classList.add("tooltip");
        document.body.appendChild(div);
    }

    function mouseMove(event: MouseEvent) {
        div.style.left = `${event.pageX + 5}px`;
        div.style.top = `${event.pageY + 5}px`;
    }

    function mouseLeave() {
        document.body.removeChild(div);
        // NOTE: restore the `title` attribute
        element.setAttribute('title', title);
    }

    element.addEventListener('mouseover', mouseOver);
    element.addEventListener('mouseleave', mouseLeave);
    element.addEventListener('mousemove', mouseMove);

    return {
        destroy() {
            element.removeEventListener('mouseover', mouseOver);
            element.removeEventListener('mouseleave', mouseLeave);
            element.removeEventListener('mousemove', mouseMove);
        }
    }
}

export function draggable(node: HTMLElement, options: { x: number, y: number }) {
    const {x, y} = options

    let moving = false;
    let left = x;
    let top = y;

    node.style.position = 'absolute';
    node.style.top = `${top}px`;
    node.style.left = `${left}px`;
    node.style.cursor = 'move';
    node.style.userSelect = 'none';

    const mouseDown = () => {
        moving = true;
    };
    node.addEventListener('mousedown', mouseDown);

    const mouseMove = (e: MouseEvent) => {
        if (moving) {
            left += e.movementX;
            top += e.movementY;
            node.style.top = `${top}px`;
            node.style.left = `${left}px`;
        }
    };
    window.addEventListener('mousemove', mouseMove);

    const mouseUp = () => {
        moving = false;
    }
    window.addEventListener('mouseup', mouseUp);

    return {
        destroy: () => {
            window.removeEventListener("mouseup", mouseUp);
            window.removeEventListener("mousemove", mouseMove);
            node.removeEventListener("mousedown", mouseDown);
        }
    }
}