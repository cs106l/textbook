import { Link } from "@mui/material";
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
import { forwardRef, useMemo } from "react";

export interface NavItemProps
  extends Omit<UseTreeItem2Parameters, "rootRef">,
  Omit<React.HTMLAttributes<HTMLLIElement>, "onFocus"> {
  href?: string;
}

const NavItem = forwardRef(function CustomTreeItem(
  props: NavItemProps,
  ref: React.Ref<HTMLLIElement>
) {
  const { id, itemId, label, href, disabled, children, ...other } = props;

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
      >
        <TreeItem2IconContainer
          {...getIconContainerProps()}
          sx={{
            transform: status.expanded ? "rotate(180deg)" : "rotate(90deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <TreeItem2Icon status={status} />
        </TreeItem2IconContainer>
        <TreeItem2Checkbox {...getCheckboxProps()} />
        <TreeItem2Label {...getLabelProps()} />
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
  }, [disabled, href]);

  return (
    <TreeItem2Provider itemId={itemId}>
      <TreeItem2Root {...getRootProps(other)} sx={{ paddingBottom: 0.5 }}>
        {linkedContents}
        {children && (
          <TreeItem2GroupTransition {...getGroupTransitionProps()} />
        )}
      </TreeItem2Root>
    </TreeItem2Provider>
  );
});

export default NavItem;
