#include <common_frag>

uniform vec3 emissive;

#include <uv_pars_frag>
#include <color_pars_frag>
#include <diffuseMap_pars_frag>
#include <normalMap_pars_frag>
#include <bumpMap_pars_frag>
#include <light_pars_frag>
#include <normal_pars_frag>
#include <viewModelPos_pars_frag>
#include <bsdfs>
#include <envMap_pars_frag>
#include <aoMap_pars_frag>
#include <shadowMap_pars_frag>
#include <fog_pars_frag>
#include <emissiveMap_pars_frag>
#include <clippingPlanes_pars_frag>
void main() {
    #include <clippingPlanes_frag>
    #include <begin_frag>
    #include <color_frag>
    #include <diffuseMap_frag>
    #include <normal_frag>
    #include <light_frag>
    #include <envMap_frag>
    #include <shadowMap_frag>

    vec3 totalEmissiveRadiance = emissive;
    #include <emissiveMap_frag>
    outColor += vec4(totalEmissiveRadiance.rgb, 0.0);

    #include <end_frag>
    #include <encodings_frag>
    #include <premultipliedAlpha_frag>
    #include <fog_frag>
}