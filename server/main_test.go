package cms

import "testing"

func TestRoleHierarchy(t *testing.T) {
	if rank("author") >= rank("editor") || rank("editor") >= rank("super_admin") {
		t.Fatal("role hierarchy is invalid")
	}
	if rank("unknown") != 0 {
		t.Fatal("unknown role must not be authorized")
	}
}
func TestThemeValidation(t *testing.T) {
	if !validTheme(map[string]any{"primary": "#112631", "accent": "#b98e45"}) {
		t.Fatal("valid colors rejected")
	}
	if validTheme(map[string]any{"primary": "javascript:alert(1)"}) {
		t.Fatal("unsafe color accepted")
	}
}
func TestSlugValidation(t *testing.T) {
	for _, v := range []string{"home", "king-room", "room-2"} {
		if !slugRE.MatchString(v) {
			t.Fatalf("valid slug rejected: %s", v)
		}
	}
	for _, v := range []string{"Room One", "../room", "room_1", "-room"} {
		if slugRE.MatchString(v) {
			t.Fatalf("invalid slug accepted: %s", v)
		}
	}
}
