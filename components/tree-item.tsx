import { Link, SxProps } from "@mui/material";
import {
  TreeItem2Checkbox,
  TreeItem2Content,
  TreeItem2GroupTransition,
  TreeItem2Icon,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2Provider,
  TreeItem2Root,
  useTreeItem2,
  UseTreeItem2Parameters,
} from "@mui/x-tree-view";
import { useRouter } from "next/navigation";
import { forwardRef, useMemo } from "react";

export const TreeItemClasses = {
  label: "tree-item-label",
  iconContainer: "tree-item-icon-container",
  content: "tree-item-content",
} as const;

export interface NavItemProps
  extends Omit<UseTreeItem2Parameters, "rootRef">,
    Omit<React.HTMLAttributes<HTMLLIElement>, "onFocus"> {
  href?: string;
  sx?: SxProps;
}

const TreeItem = forwardRef(function CustomTreeItem(
  props: NavItemProps,
  ref: React.Ref<HTMLLIElement>
) {
  const { id, itemId, label, href, disabled, children, sx, ...other } = props;

  const {
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getCheckboxProps,
    getLabelProps,
    getGroupTransitionProps,
    status,
  } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });

  /* Wraps the TreeItem contents in a Link if an href is provided */
  const linkedContents = useMemo(() => {
    const innerContents = (
      <TreeItem2Content
        {...getContentProps()}
        sx={{
          flexDirection: "row-reverse",
          cursor: disabled ? "unset" : undefined,
        }}
        className={TreeItemClasses.content}
      >
        <TreeItem2IconContainer
          {...getIconContainerProps()}
          sx={{
            transform: status.expanded ? "rotate(180deg)" : "rotate(90deg)",
            transition: "transform 0.2s ease",
          }}
          className={TreeItemClasses.iconContainer}
        >
          <TreeItem2Icon status={status} />
        </TreeItem2IconContainer>
        <TreeItem2Checkbox {...getCheckboxProps()} />
        <TreeItem2Label
          {...getLabelProps()}
          className={TreeItemClasses.label}
        />
      </TreeItem2Content>
    );
    if (!disabled && href)
      return (
        <Link
          href={href}
          color="inherit"
          sx={{ textDecoration: "none", display: "block" }}
        >
          {innerContents}
        </Link>
      );
    return innerContents;
  }, [
    getCheckboxProps,
    getContentProps,
    getIconContainerProps,
    getLabelProps,
    status,
    disabled,
    href,
  ]);

  const rootProps = getRootProps(other);
  const router = useRouter();

  return (
    <TreeItem2Provider itemId={itemId}>
      <TreeItem2Root
        {...rootProps}
        onKeyDown={(evt) => {
          /* If we press enter on a TreeItem and it has an href, navigate to that page */
          if (
            evt.key === "Enter" &&
            href &&
            document.activeElement === evt.currentTarget
          ) {
            router.push(href);
            evt.preventDefault();
          }
          rootProps.onKeyDown(evt);
        }}
        sx={sx}
      >
        {linkedContents}
        {children && (
          <TreeItem2GroupTransition {...getGroupTransitionProps()} />
        )}
      </TreeItem2Root>
    </TreeItem2Provider>
  );
});

export default TreeItem;
